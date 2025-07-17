import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/upload/video')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 150, // 150MB
      },
    }),
  )
  async uploadVideo(@UploadedFile() file: MulterFile) {
    try {
      const result = await this.appService.uploadVideo(file);

      if (!result.success || !fs.existsSync(result.audioPath)) {
        throw new Error('Falha ao processar o vídeo');
      }

      return {
        success: true,
        message: 'Áudio extraído com sucesso',
        filename: path.basename(result.audioPath),
        path: result.audioPath,
      };
    } catch (error) {
      console.error('Erro:', error);
      return {
        success: false,
        message: 'Erro ao processar o vídeo',
        error: error.message,
      };
    }
  }
}
