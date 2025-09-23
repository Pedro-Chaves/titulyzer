export interface VideoAnalysis {
  id: string;
  filename: string;
  transcription: string;
  analysis: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  message: string;
  filename: string;
  transcription: string;
  analysis: string;
}

export interface SearchResponse {
  analyses: VideoAnalysis[];
  total: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
