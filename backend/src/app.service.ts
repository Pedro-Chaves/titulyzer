import { Injectable } from '@nestjs/common';
import { File as MulterFile } from 'multer';
import { UploadResult } from './interfaces/upload-result.interface';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { promisify } from 'util';

const pipeline = promisify(require('stream').pipeline);
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async uploadVideo(file: MulterFile): Promise<UploadResult> {
    try {
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
      }

      const videoPath = path.join(tmpDir, `input-${Date.now()}.mp4`);
      const audioPath = path.join(tmpDir, `output-${Date.now()}.wav`);

      await pipeline(
        Readable.from(file.buffer),
        fs.createWriteStream(videoPath),
      );

      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .noVideo()
          .audioCodec('pcm_s16le')
          .audioChannels(2)
          .audioFrequency(44100)
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
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      throw error;
    }
  }
}
