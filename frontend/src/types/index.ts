export interface VideoAnalysis {
  id: string;
  filename: string;
  transcription: string;
  analysis: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  title: string;
  description: string;
  summary: string;
  tags: string[];
}

export interface SearchResponse {
  analyses: VideoAnalysis[];
  total: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
