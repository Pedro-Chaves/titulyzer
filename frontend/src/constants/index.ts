// Constantes da API
export const API_ENDPOINTS = {
  UPLOAD: '/upload/video',
  ANALYSES: '/analyses',
  SEARCH: '/analyses/search',
} as const;

// Tipos de arquivo suportados
export const FILE_TYPES = {
  VIDEO: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'],
  AUDIO: ['mp3', 'wav', 'flac', 'aac'],
} as const;

// Configurações de upload
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 150 * 1024 * 1024, // 150MB
  TIMEOUT: 600000, // 10 minutes
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
} as const;

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  UPLOAD_FAILED: 'Erro ao fazer upload do arquivo',
  INVALID_FILE_TYPE: 'Tipo de arquivo não suportado',
  FILE_TOO_LARGE: 'Arquivo muito grande',
  NETWORK_ERROR: 'Erro de conexão com o servidor',
  TIMEOUT: 'Tempo limite excedido',
  GENERIC: 'Ocorreu um erro inesperado',
} as const;

// Tipos de busca
export const SEARCH_TYPES = {
  FILENAME: 'filename',
  CONTENT: 'content',
} as const;

// Regex patterns
export const PATTERNS = {
  VIDEO_EXTENSION: /\.(mp4|avi|mov|mkv|wmv|flv|webm)$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  FILENAME_SAFE: /^[a-zA-Z0-9._-]+$/,
} as const;