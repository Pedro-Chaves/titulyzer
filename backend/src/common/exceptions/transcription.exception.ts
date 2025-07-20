/**
 * Exceção personalizada para erros de transcrição
 */
export class TranscriptionException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'TranscriptionException';
  }
}

/**
 * Códigos de erro padronizados
 */
export const TranscriptionErrorCodes = {
  API_KEY_MISSING: 'API_KEY_MISSING',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  AUDIO_EXTRACTION_FAILED: 'AUDIO_EXTRACTION_FAILED',
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  INVALID_AUDIO_FORMAT: 'INVALID_AUDIO_FORMAT',
  CHUNK_PROCESSING_FAILED: 'CHUNK_PROCESSING_FAILED',
} as const;
