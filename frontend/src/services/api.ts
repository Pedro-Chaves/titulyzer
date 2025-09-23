import axios from 'axios';
import { UploadResponse, VideoAnalysis, SearchResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for large video uploads
});

export const videoService = {
  // Upload e análise de vídeo
  uploadVideo: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('video', file);

    const response = await api.post<UploadResponse>('/upload', formData, {
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
    const response = await api.get<VideoAnalysis[]>('/video-analysis');
    return response.data;
  },

  // Buscar por nome do arquivo
  searchByFilename: async (filename: string): Promise<SearchResponse> => {
    const response = await api.get<SearchResponse>(`/video-analysis/search/filename/${encodeURIComponent(filename)}`);
    return response.data;
  },

  // Buscar por texto na transcrição
  searchByText: async (text: string): Promise<SearchResponse> => {
    const response = await api.get<SearchResponse>(`/video-analysis/search/text/${encodeURIComponent(text)}`);
    return response.data;
  },
};
