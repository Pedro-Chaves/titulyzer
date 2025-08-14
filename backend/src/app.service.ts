import { Injectable } from '@nestjs/common';
import { File as MulterFile } from 'multer';
import { UploadResult } from './interfaces/upload-result.interface';
import { VideoAnalysisService } from './video-analysis/video-analysis.service';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { promisify } from 'util';
import { TranscriptionService } from './transcription/transcription.service';
import { AiService } from './ai/ai.service';

const pipeline = promisify(require('stream').pipeline);
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class AppService {
  constructor(
    private readonly transcriptionService: TranscriptionService,
    private readonly aiService: AiService,
    private readonly videoAnalysisService: VideoAnalysisService,
  ) {}

  async processVideo(file: MulterFile): Promise<UploadResult> {
    try {
      // 1. Extrair áudio do vídeo
      const audio = await this.extractAudio(file);

      // 2. Transcrever áudio
      const transcription = await this.transcriptionService.transcribeAudio(
        audio.audioPath,
      );

      // 3. Gerar análise de conteúdo com IA
      console.log('🤖 Gerando análise de conteúdo...');
      const analysis = await this.aiService.analyzeVideoContent(
        transcription,
        file.originalname,
      );

      // 4. Salvar arquivo de transcrição
      const transcriptionPath = await this.saveTranscription(
        transcription,
        file.originalname,
      );

      // 5. Salvar análise no banco de dados
      const filename = path.basename(audio.audioPath, '.wav');
      await this.saveAnalysisToDatabase(
        analysis,
        transcription,
        file.originalname,
        filename,
      );

      console.log('✅ Transcrição salva em:', transcriptionPath);
      console.log('✅ Análise salva no banco de dados');
      console.log('🎬 Título gerado:', analysis.title);

      // 6. Limpar arquivos temporários
      await this.cleanupTemporaryFiles(audio.audioPath, transcriptionPath);

      return {
        ...audio,
        title: analysis.title,
        description: analysis.description,
        summary: analysis.summary,
        tags: analysis.tags,
      };
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      throw error;
    }
  }

  private async saveTranscription(
    transcription: string,
    originalFilename: string,
  ): Promise<string> {
    const tmpDir = path.join(process.cwd(), 'tmp');

    // Remove extensão do arquivo original e adiciona timestamp
    const baseName = path.parse(originalFilename).name;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const transcriptionFilename = `transcricao_${baseName}_${timestamp}.txt`;
    const transcriptionPath = path.join(tmpDir, transcriptionFilename);

    await fs.promises.writeFile(transcriptionPath, transcription, 'utf8');

    return transcriptionPath;
  }

  private async saveAnalysisToDatabase(
    analysis: {
      title: string;
      description: string;
      summary: string;
      tags: string[];
      aiModel: string;
    },
    transcription: string,
    originalName: string,
    filename: string,
  ): Promise<void> {
    await this.videoAnalysisService.createAnalysis({
      filename,
      originalName,
      summary: analysis.summary,
      tags: analysis.tags,
      aiModel: analysis.aiModel,
      transcription,
    });
  }

  private async cleanupTemporaryFiles(
    audioPath: string,
    transcriptionPath: string,
  ): Promise<void> {
    try {
      // Remove arquivo de áudio temporário
      if (fs.existsSync(audioPath)) {
        await fs.promises.unlink(audioPath);
        console.log('🗑️ Arquivo de áudio removido:', audioPath);
      }

      // Remove arquivo de transcrição temporário
      if (fs.existsSync(transcriptionPath)) {
        await fs.promises.unlink(transcriptionPath);
        console.log('🗑️ Arquivo de transcrição removido:', transcriptionPath);
      }
    } catch (error) {
      console.error('⚠️ Erro ao limpar arquivos temporários:', error);
      // Não propaga o erro para não afetar o resultado principal
    }
  }

  private async extractAudio(file: MulterFile): Promise<UploadResult> {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    const videoPath = path.join(tmpDir, `input-${Date.now()}.mp4`);
    const audioPath = path.join(tmpDir, `output-${Date.now()}.wav`);

    await pipeline(Readable.from(file.buffer), fs.createWriteStream(videoPath));

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('progress', (progress) => {
          console.log('Processando:', progress.percent, '% concluído');
        })
        .save(audioPath)
        .on('end', async () => {
          console.log('Áudio extraído com sucesso!');
          console.log('Caminho do áudio:', audioPath);
          try {
            resolve({
              success: true,
              audioPath,
            });

            await fs.promises.unlink(videoPath);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', async (err) => {
          console.error('Erro:', err);
          try {
            if (fs.existsSync(videoPath)) await fs.promises.unlink(videoPath);
            if (fs.existsSync(audioPath)) await fs.promises.unlink(audioPath);
          } catch (cleanupError) {
            console.error('Erro ao limpar arquivos:', cleanupError);
          }
          reject(err);
        });
    });
  }
}
