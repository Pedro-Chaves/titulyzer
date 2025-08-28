import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AiService', () => {
  let service: AiService;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Constructor validation', () => {
    it('should initialize with Groq API key', async () => {
      process.env.GROQ_API_KEY = 'test-groq-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [AiService],
      }).compile();

      service = module.get<AiService>(AiService);
      expect(service).toBeDefined();
    });

    it('should initialize with Gemini API key', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [AiService],
      }).compile();

      service = module.get<AiService>(AiService);
      expect(service).toBeDefined();
    });

    it('should initialize with OpenAI API key', async () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [AiService],
      }).compile();

      service = module.get<AiService>(AiService);
      expect(service).toBeDefined();
    });

    it('should throw error when no API keys are configured', async () => {
      delete process.env.GROQ_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(
        Test.createTestingModule({
          providers: [AiService],
        }).compile(),
      ).rejects.toThrow('Nenhuma API de IA configurada');
    });
  });

  describe('analyzeVideoContent', () => {
    beforeEach(async () => {
      process.env.GROQ_API_KEY = 'test-groq-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [AiService],
      }).compile();

      service = module.get<AiService>(AiService);
    });

    it('should analyze video content with Groq API', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Test Title',
                  description: 'Test Description',
                  summary: 'Test Summary',
                  tags: ['test', 'video'],
                }),
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeVideoContent(
        'Test transcription',
        'test-video.mp4',
      );

      expect(result).toEqual({
        title: 'Test Title',
        description: 'Test Description',
        summary: 'Test Summary',
        tags: ['test', 'video'],
        aiModel: 'groq',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.any(Array),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-groq-key',
          }),
        }),
      );
    });

    it('should fallback to next API if Groq fails', async () => {
      const originalGroqKey = process.env.GROQ_API_KEY;
      const originalGeminiKey = process.env.GEMINI_API_KEY;

      process.env.GROQ_API_KEY = 'test-groq-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [AiService],
      }).compile();
      const testService = module.get<AiService>(AiService);

      // Primeiro mock: Groq falha (primeiro modelo tentado)
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Server error' },
        },
        message: 'Request failed',
      });

      // Segundo mock: Groq falha (segundo modelo tentado)
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Server error' },
        },
        message: 'Request failed',
      });

      // Terceiro mock: Groq falha (terceiro modelo tentado)
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Server error' },
        },
        message: 'Request failed',
      });

      // Quarto mock: Gemini succeede
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: 'Gemini Title',
                      description: 'Gemini Description',
                      summary: 'Gemini Summary',
                      tags: ['gemini', 'test'],
                    }),
                  },
                ],
              },
            },
          ],
        },
      });

      const result =
        await testService.analyzeVideoContent('Test transcription');

      expect(result.aiModel).toBe('gemini');
      expect(result.title).toBe('Gemini Title');

      process.env.GROQ_API_KEY = originalGroqKey;
      process.env.GEMINI_API_KEY = originalGeminiKey;
    });

    it('should throw error if all APIs fail', async () => {
      mockedAxios.post.mockRejectedValue(new Error('All APIs failed'));

      await expect(
        service.analyzeVideoContent('Test transcription'),
      ).rejects.toThrow(
        'Todas as APIs de IA falharam. Verifique suas chaves de API e conexão com a internet.',
      );
    });

    it('should handle invalid JSON response gracefully', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Invalid JSON response',
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeVideoContent('Test transcription');

      expect(result.title).toBe('Título Gerado pela IA');
      expect(result.description).toBe('Invalid JSON response');
      expect(result.summary).toBe('Invalid JSON response...');
    });
  });

  describe('Input validation', () => {
    beforeEach(async () => {
      process.env.GROQ_API_KEY = 'test-groq-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [AiService],
      }).compile();

      service = module.get<AiService>(AiService);
    });

    it('should handle empty transcription', async () => {
      await expect(service.analyzeVideoContent('')).rejects.toThrow();
    });

    it('should handle very long transcription', async () => {
      const longTranscription = 'a'.repeat(50000);

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Long Video Title',
                  description: 'Long Video Description',
                  summary: 'Long Video Summary',
                  tags: ['long', 'video'],
                }),
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeVideoContent(longTranscription);
      expect(result).toBeDefined();
      expect(result.aiModel).toBe('groq');
    });
  });
});
