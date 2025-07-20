import { Injectable } from '@nestjs/common';
import { File as MulterFile } from 'multer';
import { UploadResult } from './interfaces/upload-result.interface';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { promisify } from 'util';
import { TranscriptionService } from './transcription/transcription.service';

const pipeline = promisify(require('stream').pipeline);
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class AppService {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  async uploadVideo(file: MulterFile): Promise<UploadResult> {
    try {
      const audio = await this.audioExtract(file);
      const transcription = await this.transcriptionService.transcribeAudio(
        audio.audioPath,
      );

      // Criar arquivo de transcrição
      const transcriptionPath = await this.saveTranscription(
        transcription,
        file.originalname,
      );

      console.log('✅ Transcrição salva em:', transcriptionPath);

      return {
        ...audio,
        transcriptionPath,
        transcription,
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

  private async audioExtract(file: MulterFile): Promise<UploadResult> {
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
