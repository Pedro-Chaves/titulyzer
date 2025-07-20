export interface UploadResult {
  success: boolean;
  audioPath: string;
  transcriptionPath?: string;
  transcription?: string;
}
