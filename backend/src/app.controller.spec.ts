import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoAnalysisService } from './video-analysis/video-analysis.service';

describe('AppController', () => {
  let controller: AppController;

  const mockAnalysis = {
    _id: '507f1f77bcf86cd799439011',
    filename: 'test-video',
    originalName: 'test-video.mp4',
    summary: 'Test summary',
    tags: ['test', 'video'],
    aiModel: 'groq',
    transcription: 'Test transcription',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUploadResult = {
    success: true,
    audioPath: '/path/to/audio.wav',
    title: 'Test Title',
    description: 'Test Description',
    summary: 'Test Summary',
    tags: ['test', 'video'],
  };

  const mockAppService = {
    processVideo: jest.fn(),
  };

  const mockVideoAnalysisService = {
    findAll: jest.fn(),
    findByFilename: jest.fn(),
    searchByText: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: VideoAnalysisService,
          useValue: mockVideoAnalysisService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadVideo', () => {
    const mockFile = {
      originalname: 'test-video.mp4',
      buffer: Buffer.from('test video data'),
      mimetype: 'video/mp4',
      size: 1024,
    } as any;

    it('should upload and process video successfully', async () => {
      mockAppService.processVideo.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadVideo(mockFile);

      expect(result).toEqual({
        success: true,
        message: 'Vídeo processado, transcrito e analisado com sucesso',
        title: 'Test Title',
        description: 'Test Description',
        summary: 'Test Summary',
        tags: ['test', 'video'],
      });

      expect(mockAppService.processVideo).toHaveBeenCalledWith(mockFile);
    });

    it('should handle processing failure', async () => {
      mockAppService.processVideo.mockResolvedValue({ success: false });

      const result = await controller.uploadVideo(mockFile);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao processar o vídeo');
    });

    it('should handle service exception', async () => {
      const errorMessage = 'Service error';
      mockAppService.processVideo.mockRejectedValue(new Error(errorMessage));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await controller.uploadVideo(mockFile);

      expect(result).toEqual({
        success: false,
        message: 'Erro ao processar o vídeo',
        error: errorMessage,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Erro no processamento do vídeo:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getAllAnalyses', () => {
    it('should return all analyses successfully', async () => {
      const mockAnalyses = [mockAnalysis];
      mockVideoAnalysisService.findAll.mockResolvedValue(mockAnalyses);

      const result = await controller.getAllAnalyses();

      expect(result).toEqual({
        success: true,
        data: mockAnalyses,
      });

      expect(mockVideoAnalysisService.findAll).toHaveBeenCalled();
    });

    it('should handle service error', async () => {
      const errorMessage = 'Database error';
      mockVideoAnalysisService.findAll.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await controller.getAllAnalyses();

      expect(result).toEqual({
        success: false,
        message: 'Erro ao buscar análises',
        error: errorMessage,
      });
    });
  });

  describe('searchAnalyses', () => {
    it('should search analyses successfully', async () => {
      const query = 'test query';
      const mockAnalyses = [mockAnalysis];
      mockVideoAnalysisService.searchByText.mockResolvedValue(mockAnalyses);

      const result = await controller.searchAnalyses(query);

      expect(result).toEqual({
        success: true,
        data: mockAnalyses,
      });

      expect(mockVideoAnalysisService.searchByText).toHaveBeenCalledWith(query);
    });

    it('should return error for empty query', async () => {
      const result = await controller.searchAnalyses('');

      expect(result).toEqual({
        success: false,
        message: 'Parâmetro de busca é obrigatório',
      });

      expect(mockVideoAnalysisService.searchByText).not.toHaveBeenCalled();
    });

    it('should return error for undefined query', async () => {
      const result = await controller.searchAnalyses(undefined as any);

      expect(result).toEqual({
        success: false,
        message: 'Parâmetro de busca é obrigatório',
      });
    });

    it('should handle service error', async () => {
      const query = 'test query';
      const errorMessage = 'Search error';
      mockVideoAnalysisService.searchByText.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await controller.searchAnalyses(query);

      expect(result).toEqual({
        success: false,
        message: 'Erro ao buscar análises',
        error: errorMessage,
      });
    });
  });

  describe('getAnalysisByFilename', () => {
    it('should return analysis by filename successfully', async () => {
      const filename = 'test-video';
      mockVideoAnalysisService.findByFilename.mockResolvedValue(mockAnalysis);

      const result = await controller.getAnalysisByFilename(filename);

      expect(result).toEqual({
        success: true,
        data: mockAnalysis,
      });

      expect(mockVideoAnalysisService.findByFilename).toHaveBeenCalledWith(
        filename,
      );
    });

    it('should return error when analysis not found', async () => {
      const filename = 'nonexistent-video';
      mockVideoAnalysisService.findByFilename.mockResolvedValue(null);

      const result = await controller.getAnalysisByFilename(filename);

      expect(result).toEqual({
        success: false,
        message: 'Análise não encontrada',
      });
    });

    it('should handle service error', async () => {
      const filename = 'test-video';
      const errorMessage = 'Database error';
      mockVideoAnalysisService.findByFilename.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await controller.getAnalysisByFilename(filename);

      expect(result).toEqual({
        success: false,
        message: 'Erro ao buscar análise',
        error: errorMessage,
      });
    });
  });
});
