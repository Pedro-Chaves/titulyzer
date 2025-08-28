import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VideoAnalysisService } from './video-analysis.service';
import {
  VideoAnalysis,
  VideoAnalysisDocument,
} from '../schemas/video-analysis.schema';

describe('VideoAnalysisService', () => {
  let service: VideoAnalysisService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let model: Model<VideoAnalysisDocument>;

  const mockVideoAnalysis = {
    _id: '507f1f77bcf86cd799439011',
    filename: 'test-video',
    originalName: 'test-video.mp4',
    summary: 'Test summary',
    tags: ['test', 'video'],
    aiModel: 'groq',
    transcription: 'Test transcription',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockModel = jest.fn() as any;

  mockModel.find = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.findOneAndUpdate = jest.fn();
  mockModel.deleteOne = jest.fn();
  mockModel.exec = jest.fn();
  mockModel.sort = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoAnalysisService,
        {
          provide: getModelToken(VideoAnalysis.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<VideoAnalysisService>(VideoAnalysisService);
    model = module.get<Model<VideoAnalysisDocument>>(
      getModelToken(VideoAnalysis.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAnalysis', () => {
    it('should create a new video analysis', async () => {
      const analysisData = {
        filename: 'test-video',
        originalName: 'test-video.mp4',
        summary: 'Test summary',
        tags: ['test'],
        aiModel: 'groq',
        transcription: 'Test transcription',
      };

      const savedAnalysis = {
        ...analysisData,
        _id: 'test-id',
        save: jest.fn().mockResolvedValue({ ...analysisData, _id: 'test-id' }),
      };

      mockModel.mockImplementation(() => savedAnalysis);

      const result = await service.createAnalysis(analysisData);

      expect(mockModel).toHaveBeenCalledWith(analysisData);
      expect(savedAnalysis.save).toHaveBeenCalled();
      expect(result).toEqual({ ...analysisData, _id: 'test-id' });
    });
  });

  describe('findByFilename', () => {
    it('should find analysis by filename', async () => {
      const filename = 'test-video';

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockVideoAnalysis),
      });

      const result = await service.findByFilename(filename);

      expect(mockModel.findOne).toHaveBeenCalledWith({ filename });
      expect(result).toEqual(mockVideoAnalysis);
    });

    it('should return null if analysis not found', async () => {
      const filename = 'nonexistent-video';

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByFilename(filename);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all analyses sorted by creation date', async () => {
      const mockAnalyses = [mockVideoAnalysis];

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockAnalyses),
        }),
      });

      const result = await service.findAll();

      expect(mockModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockAnalyses);
    });
  });

  describe('findByTags', () => {
    it('should find analyses by tags', async () => {
      const tags = ['test', 'video'];
      const mockAnalyses = [mockVideoAnalysis];

      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAnalyses),
      });

      const result = await service.findByTags(tags);

      expect(mockModel.find).toHaveBeenCalledWith({ tags: { $in: tags } });
      expect(result).toEqual(mockAnalyses);
    });
  });

  describe('searchByText', () => {
    it('should search analyses by text', async () => {
      const query = 'test query';
      const mockAnalyses = [mockVideoAnalysis];

      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAnalyses),
      });

      const result = await service.searchByText(query);

      expect(mockModel.find).toHaveBeenCalledWith({
        $text: { $search: query },
      });
      expect(result).toEqual(mockAnalyses);
    });
  });

  describe('deleteByFilename', () => {
    it('should delete analysis by filename', async () => {
      const filename = 'test-video';

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.deleteByFilename(filename);

      expect(mockModel.deleteOne).toHaveBeenCalledWith({ filename });
    });
  });

  describe('updateAnalysis', () => {
    it('should update analysis by filename', async () => {
      const filename = 'test-video';
      const updateData = { summary: 'Updated summary' };
      const updatedAnalysis = { ...mockVideoAnalysis, ...updateData };

      mockModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedAnalysis),
      });

      const result = await service.updateAnalysis(filename, updateData);

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { filename },
        updateData,
        { new: true },
      );
      expect(result).toEqual(updatedAnalysis);
    });
  });
});
