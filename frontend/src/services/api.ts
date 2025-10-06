import axios from 'axios';
import { UploadResponse, VideoAnalysis } from '../types';
import { API_ENDPOINTS, UPLOAD_CONFIG, PATTERNS } from '../constants';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3030';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: UPLOAD_CONFIG.TIMEOUT,
});

export const videoService = {
  // Upload e análise de vídeo
  uploadVideo: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>(API_ENDPOINTS.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  // Buscar todas as análises (histórico)
  getAllAnalyses: async (): Promise<VideoAnalysis[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYSES);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Se não for um array, retorna array vazio
      if (response.data?.success) {
        return [];
      }
      
      throw new Error(response.data?.message || 'Erro ao buscar análises');
    } catch (error: any) {
      console.error('Erro na API getAllAnalyses:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao conectar com o servidor');
    }
  },

  // Buscar por nome do arquivo
  searchByFilename: async (filename: string): Promise<VideoAnalysis[]> => {
    try {
      const response = await api.get(`${API_ENDPOINTS.ANALYSES}/${encodeURIComponent(filename)}`);
      if (response.data?.success && response.data.data) {
        return [response.data.data]; // Retorna como array para consistência
      }
      return [];
    } catch (error: any) {
      console.error('Erro na busca por filename:', error);
      return [];
    }
  },

  // Buscar por texto na análise/transcrição
  searchByText: async (text: string): Promise<VideoAnalysis[]> => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(text)}`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('Erro na busca por texto:', error);
      return [];
    }
  },

  // Busca inteligente - decide automaticamente o tipo
  searchAnalyses: async (query: string): Promise<{ results: VideoAnalysis[], searchType: 'filename' | 'content' }> => {
    const trimmedQuery = query.trim();
    
    // Se parece com nome de arquivo (tem extensão de vídeo)
    const isFilename = PATTERNS.VIDEO_EXTENSION.test(trimmedQuery) || 
                      (!trimmedQuery.includes(' ') && trimmedQuery.length > 3);
    
    if (isFilename) {
      const results = await videoService.searchByFilename(trimmedQuery);
      return { results, searchType: 'filename' };
    } else {
      const results = await videoService.searchByText(trimmedQuery);
      return { results, searchType: 'content' };
    }
  },
};
