export interface TranscriptionOptionsDto {
  language?: string;
  encoding?: string;
  sampleRateHertz?: number;
  chunkDuration?: number;
}

export class TranscriptionOptions implements TranscriptionOptionsDto {
  language: string = 'pt-BR';
  encoding: string = 'LINEAR16';
  sampleRateHertz: number = 16000;
  chunkDuration: number = 45;

  constructor(options?: Partial<TranscriptionOptionsDto>) {
    if (options) {
      Object.assign(this, options);
    }
  }

  /**
   * Valida se as opções estão dentro dos limites permitidos
   */
  validate(): void {
    const validLanguages = ['pt-BR', 'en-US', 'es-ES'];
    const validEncodings = ['LINEAR16', 'FLAC', 'MULAW', 'AMR', 'AMR_WB'];

    if (!validLanguages.includes(this.language)) {
      throw new Error(`Idioma inválido: ${this.language}`);
    }

    if (!validEncodings.includes(this.encoding)) {
      throw new Error(`Encoding inválido: ${this.encoding}`);
    }

    if (this.sampleRateHertz < 8000 || this.sampleRateHertz > 48000) {
      throw new Error(`Sample rate deve estar entre 8000 e 48000 Hz`);
    }

    if (this.chunkDuration < 10 || this.chunkDuration > 120) {
      throw new Error(`Duração do chunk deve estar entre 10 e 120 segundos`);
    }
  }
}
