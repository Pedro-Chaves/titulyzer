import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';

@Injectable()
export class TranscriptionService {
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
    if (!apiKey) {
      console.error(
        '❌ Erro: GOOGLE_SPEECH_API_KEY não está definida nas variáveis de ambiente',
      );
      throw new Error(
        'GOOGLE_SPEECH_API_KEY não está definida nas variáveis de ambiente',
      );
    }
    this.apiKey = apiKey;
    console.log('✅ Serviço de transcrição configurado com sucesso');
  }

  async transcribeAudio(audioPath: string): Promise<string> {
    console.log('Iniciando transcrição do áudio:', audioPath);

    if (!fs.existsSync(audioPath)) {
      throw new Error('Arquivo de áudio não encontrado');
    }

    const stats = fs.statSync(audioPath);
    console.log(`📁 Arquivo: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

    // Sempre usa chunks para arquivos grandes (mais de 5MB base64)
    const audioContent = fs.readFileSync(audioPath);
    const base64Content = audioContent.toString('base64');
    const base64SizeInMB = (base64Content.length / (1024 * 1024)).toFixed(2);
    console.log(`📦 Tamanho base64: ${base64SizeInMB} MB`);

    if (base64Content.length > 5 * 1024 * 1024) {
      console.log(`🔪 Dividindo arquivo (${base64SizeInMB}MB) em chunks...`);
      return await this.processLargeAudioInChunks(audioPath);
    }

    // Para arquivos pequenos, transcrição direta
    console.log('⚡ Transcrevendo arquivo pequeno...');
    try {
      return await this.transcribeDirectly(base64Content);
    } catch (error) {
      if (error.message === 'FORCE_CHUNKS') {
        console.log('🔄 Forçando uso de chunks devido ao erro...');
        return await this.processLargeAudioInChunks(audioPath);
      }
      throw error;
    }
  }

  private async transcribeDirectly(base64Content: string): Promise<string> {
    const requestBody = {
      audio: { content: base64Content },
      config: {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode: 'pt-BR',
        enableAutomaticPunctuation: true,
      },
    };

    try {
      const response = await axios.post(
        `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`,
        requestBody,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 300000,
        },
      );

      if (response.data.results && response.data.results.length > 0) {
        return response.data.results
          .map((result: any) => result.alternatives[0].transcript)
          .join(' ');
      }

      return 'Nenhuma transcrição foi possível para este áudio.';
    } catch (error) {
      console.error('❌ Erro na transcrição direta:');
      console.error('   Status:', error.response?.status);
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2));

      // Se for erro de tamanho, força uso de chunks
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || '';
        if (
          errorMessage.includes('too long') ||
          errorMessage.includes('limit')
        ) {
          console.log('🔄 Erro de tamanho detectado, tentando com chunks...');
          throw new Error('FORCE_CHUNKS');
        }
      }

      throw error;
    }
  }

  private async processLargeAudioInChunks(audioPath: string): Promise<string> {
    console.log('🔪 Dividindo em chunks de 45 segundos...');

    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    const tmpDir = require('path').join(process.cwd(), 'tmp');
    const chunkDuration = 45;
    const chunks: string[] = [];
    const transcriptions: string[] = [];

    try {
      const duration = await this.getAudioDuration(audioPath);
      const numChunks = Math.ceil(duration / chunkDuration);
      console.log(`📊 ${numChunks} chunks de ${chunkDuration}s cada`);

      // Cria os chunks
      for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDuration;
        const chunkPath = require('path').join(
          tmpDir,
          `chunk-${i}-${Date.now()}.wav`,
        );

        console.log(`🔄 Chunk ${i + 1}/${numChunks}...`);

        await new Promise<void>((resolve, reject) => {
          ffmpeg(audioPath)
            .seekInput(startTime)
            .duration(chunkDuration)
            .audioCodec('pcm_s16le')
            .audioChannels(1)
            .audioFrequency(16000)
            .audioBitrate('32k')
            .save(chunkPath)
            .on('end', () => resolve())
            .on('error', reject);
        });

        chunks.push(chunkPath);
      }

      // Transcreve cada chunk
      for (let i = 0; i < chunks.length; i++) {
        console.log(`🎵 Transcrevendo ${i + 1}/${chunks.length}...`);

        try {
          const chunkTranscription = await this.transcribeChunk(chunks[i]);
          if (chunkTranscription && chunkTranscription.trim()) {
            transcriptions.push(chunkTranscription);
          }
        } catch (error) {
          console.error(`❌ Erro no chunk ${i + 1}:`, error.message);
        }
      }

      await this.cleanupChunks(chunks);

      console.log(
        `✅ ${transcriptions.length} chunks transcritos com sucesso!`,
      );
      return (
        transcriptions.join('\n\n') ||
        'Nenhuma transcrição foi possível para este áudio.'
      );
    } catch (error) {
      await this.cleanupChunks(chunks);
      throw error;
    }
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    const ffprobe = require('fluent-ffmpeg').ffprobe;

    return new Promise((resolve, reject) => {
      ffprobe(audioPath, (err: any, metadata: any) => {
        if (err) reject(err);
        else resolve(metadata.format.duration);
      });
    });
  }

  private async transcribeChunk(chunkPath: string): Promise<string> {
    const audioContent = fs.readFileSync(chunkPath);
    const base64Content = audioContent.toString('base64');

    const requestBody = {
      audio: { content: base64Content },
      config: {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode: 'pt-BR',
        enableAutomaticPunctuation: true,
      },
    };

    const response = await axios.post(
      `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000,
      },
    );

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results
        .map((result: any) => result.alternatives[0].transcript)
        .join(' ');
    }

    return '';
  }

  private async cleanupChunks(chunks: string[]): Promise<void> {
    for (const chunk of chunks) {
      try {
        if (fs.existsSync(chunk)) {
          await fs.promises.unlink(chunk);
        }
      } catch (error) {
        console.error('Erro ao limpar chunk:', chunk, error.message);
      }
    }
  }
}
