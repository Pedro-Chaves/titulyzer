import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Query,
  Param,
} from '@nestjs/common';
import { AppService } from './app.service';
import { VideoAnalysisService } from './video-analysis/video-analysis.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly videoAnalysisService: VideoAnalysisService,
  ) {}

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
      const result = await this.appService.processVideo(file);

      if (!result.success) {
        throw new Error('Falha ao processar o vídeo');
      }

      return {
        success: true,
        message: 'Vídeo processado, transcrito e analisado com sucesso',
        title: result.title,
        description: result.description,
        summary: result.summary,
        tags: result.tags,
      };
    } catch (error) {
      console.error('Erro no processamento do vídeo:', error);
      return {
        success: false,
        message: 'Erro ao processar o vídeo',
        error: error.message,
      };
    }
  }

  @Get('/analyses')
  async getAllAnalyses() {
    try {
      const analyses = await this.videoAnalysisService.findAll();
      return {
        success: true,
        data: analyses,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao buscar análises',
        error: error.message,
      };
    }
  }

  @Get('/analyses/search')
  async searchAnalyses(@Query('q') query: string) {
    try {
      if (!query) {
        return {
          success: false,
          message: 'Parâmetro de busca é obrigatório',
        };
      }

      const analyses = await this.videoAnalysisService.searchByText(query);
      return {
        success: true,
        data: analyses,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao buscar análises',
        error: error.message,
      };
    }
  }

  @Get('/analyses/:filename')
  async getAnalysisByFilename(@Param('filename') filename: string) {
    try {
      const analysis = await this.videoAnalysisService.findByFilename(filename);
      if (!analysis) {
        return {
          success: false,
          message: 'Análise não encontrada',
        };
      }

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao buscar análise',
        error: error.message,
      };
    }
  }
}
