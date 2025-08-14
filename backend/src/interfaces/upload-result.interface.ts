export interface UploadResult {
  success: boolean;
  audioPath: string;
  title?: string;
  description?: string;
  summary?: string;
  tags?: string[];
}
