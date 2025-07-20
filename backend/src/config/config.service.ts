import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  /**
   * Obtém a chave da API do Google Speech-to-Text
   * @throws {Error} Se a chave não estiver definida
   */
  get googleSpeechApiKey(): string {
    const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GOOGLE_SPEECH_API_KEY não está definida nas variáveis de ambiente',
      );
    }
    return apiKey;
  }

  /**
   * Porta do servidor (padrão: 3000)
   */
  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  /**
   * Tamanho máximo de arquivo em bytes (padrão: 150MB)
   */
  get maxFileSize(): number {
    return parseInt(process.env.MAX_FILE_SIZE || '157286400', 10);
  }

  /**
   * Duração de cada chunk em segundos (padrão: 45s)
   */
  get chunkDuration(): number {
    return parseInt(process.env.CHUNK_DURATION || '45', 10);
  }

  /**
   * Configurações do FFmpeg para extração de áudio
   */
  get ffmpegConfig() {
    return {
      audioCodec: 'pcm_s16le',
      audioChannels: 1,
      audioFrequency: 16000,
      audioBitrate: '32k',
    };
  }

  /**
   * Configurações da API Google Speech
   */
  get speechConfig() {
    return {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 16000,
      languageCode: 'pt-BR',
      enableAutomaticPunctuation: true,
    };
  }

  /**
   * Limite de tamanho base64 para transcrição direta (5MB)
   */
  get base64SizeLimit(): number {
    return 5 * 1024 * 1024; // 5MB
  }

  /**
   * Timeout para requisições à API (5 minutos)
   */
  get apiTimeout(): number {
    return 300000; // 5 minutos
  }
}
