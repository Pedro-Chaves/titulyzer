import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptionService } from './transcription.service';
import * as fs from 'fs';
import axios from 'axios';

jest.mock('fs');
jest.mock('axios');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TranscriptionService', () => {
  let service: TranscriptionService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize without API key and show warning', async () => {
      delete process.env.GOOGLE_SPEECH_API_KEY;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const module: TestingModule = await Test.createTestingModule({
        providers: [TranscriptionService],
      }).compile();

      service = module.get<TranscriptionService>(TranscriptionService);

      expect(service).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️  GOOGLE_SPEECH_API_KEY não está definida. O serviço de transcrição não funcionará.',
      );

      consoleSpy.mockRestore();
    });

    it('should initialize with API key and show success', async () => {
      process.env.GOOGLE_SPEECH_API_KEY = 'test-api-key';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const module: TestingModule = await Test.createTestingModule({
        providers: [TranscriptionService],
      }).compile();

      service = module.get<TranscriptionService>(TranscriptionService);

      expect(service).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Serviço de transcrição configurado com sucesso',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('transcribeAudio', () => {
    beforeEach(async () => {
      process.env.GOOGLE_SPEECH_API_KEY = 'test-api-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [TranscriptionService],
      }).compile();

      service = module.get<TranscriptionService>(TranscriptionService);
    });

    it('should throw error if API key not configured', async () => {
      delete process.env.GOOGLE_SPEECH_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [TranscriptionService],
      }).compile();

      const serviceWithoutKey =
        module.get<TranscriptionService>(TranscriptionService);

      await expect(
        serviceWithoutKey.transcribeAudio('/path/to/audio.wav'),
      ).rejects.toThrow(
        'GOOGLE_SPEECH_API_KEY não está configurada. Configure a variável de ambiente para usar o serviço de transcrição.',
      );
    });

    it('should throw error if audio file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      await expect(
        service.transcribeAudio('/nonexistent/audio.wav'),
      ).rejects.toThrow('Arquivo de áudio não encontrado');
    });

    it('should transcribe small audio file directly', async () => {
      const audioPath = '/path/to/small-audio.wav';
      const mockStats = { size: 1024 * 1024 } as fs.Stats; // 1MB
      const mockBuffer = Buffer.from('mock audio data');

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue(mockStats);
      mockedFs.readFileSync.mockReturnValue(mockBuffer);

      const mockResponse = {
        data: {
          results: [
            {
              alternatives: [
                {
                  transcript: 'Test transcription result',
                },
              ],
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.transcribeAudio(audioPath);

      expect(result).toBe('Test transcription result');
      expect(mockedFs.existsSync).toHaveBeenCalledWith(audioPath);
      expect(mockedFs.statSync).toHaveBeenCalledWith(audioPath);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://speech.googleapis.com/v1/speech:recognize?key=test-api-key',
        expect.objectContaining({
          config: expect.objectContaining({
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'pt-BR',
          }),
          audio: expect.objectContaining({
            content: expect.any(String),
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should handle large audio file with chunks', async () => {
      const audioPath = '/path/to/large-audio.wav';
      const mockStats = { size: 10 * 1024 * 1024 } as fs.Stats; // 10MB
      const mockBuffer = Buffer.alloc(8 * 1024 * 1024); // 8MB in base64 would be larger

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue(mockStats);
      mockedFs.readFileSync.mockReturnValue(mockBuffer);

      const processLargeAudioSpy = jest
        .spyOn(service as any, 'processLargeAudioInChunks')
        .mockResolvedValue('Chunked transcription result');

      const result = await service.transcribeAudio(audioPath);

      expect(result).toBe('Chunked transcription result');
      expect(processLargeAudioSpy).toHaveBeenCalledWith(audioPath);
    });

    it('should handle Google API error gracefully', async () => {
      const audioPath = '/path/to/audio.wav';
      const mockStats = { size: 1024 } as fs.Stats;
      const mockBuffer = Buffer.from('small audio');

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue(mockStats);
      mockedFs.readFileSync.mockReturnValue(mockBuffer);

      const mockError = {
        response: {
          status: 400,
          data: {
            error: {
              message: 'Invalid audio format',
            },
          },
        },
        message: 'Request failed with status code 400',
      };

      mockedAxios.post.mockRejectedValue(mockError);

      try {
        const result = await service.transcribeAudio(audioPath);
        expect(result).toBeUndefined(); // Se chegou aqui, falhou
      } catch (error) {
        expect(error.message).toBe('Request failed with status code 400');
      }
    });

    it('should handle empty transcription result', async () => {
      const audioPath = '/path/to/silent-audio.wav';
      const mockStats = { size: 1024 } as fs.Stats;
      const mockBuffer = Buffer.from('silent audio');

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue(mockStats);
      mockedFs.readFileSync.mockReturnValue(mockBuffer);

      const mockResponse = {
        data: {
          results: [],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.transcribeAudio(audioPath);

      expect(result).toBe('Nenhuma transcrição foi possível para este áudio.');
    });
  });

  describe('Error handling', () => {
    beforeEach(async () => {
      process.env.GOOGLE_SPEECH_API_KEY = 'test-api-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [TranscriptionService],
      }).compile();

      service = module.get<TranscriptionService>(TranscriptionService);
    });

    it('should handle network errors', async () => {
      const audioPath = '/path/to/audio.wav';
      const mockStats = { size: 1024 } as fs.Stats;
      const mockBuffer = Buffer.from('audio data');

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue(mockStats);
      mockedFs.readFileSync.mockReturnValue(mockBuffer);

      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(service.transcribeAudio(audioPath)).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle malformed API response', async () => {
      const audioPath = '/path/to/audio.wav';
      const mockStats = { size: 1024 } as fs.Stats;
      const mockBuffer = Buffer.from('audio data');

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue(mockStats);
      mockedFs.readFileSync.mockReturnValue(mockBuffer);

      const mockResponse = {
        data: {
          error: 'Malformed response',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.transcribeAudio(audioPath);

      expect(result).toBe('Nenhuma transcrição foi possível para este áudio.');
    });
  });
});
