import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
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
        message: 'Vídeo processado e transcrito com sucesso',
        audioFilename: path.basename(result.audioPath),
        audioPath: result.audioPath,
        transcriptionFilename: result.transcriptionPath
          ? path.basename(result.transcriptionPath)
          : null,
        transcriptionPath: result.transcriptionPath,
        transcription: result.transcription,
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

  @Get('/download/transcription/:filename')
  downloadTranscription(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const tmpDir = path.join(process.cwd(), 'tmp');
      const filePath = path.join(tmpDir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo de transcrição não encontrado',
        });
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Erro ao baixar transcrição:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message,
      });
    }
  }
}
