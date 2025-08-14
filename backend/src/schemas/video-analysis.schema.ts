import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VideoAnalysisDocument = VideoAnalysis & Document;

@Schema({ timestamps: true })
export class VideoAnalysis {
  @Prop({ required: true, index: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  summary: string;

  @Prop([String])
  tags: string[];

  @Prop({ required: true })
  aiModel: string; // Qual AI foi usada: 'groq', 'gemini', 'openai'

  @Prop({ required: true })
  transcription: string;

  @Prop()
  duration?: number;

  @Prop()
  fileSize?: number;
}

export const VideoAnalysisSchema = SchemaFactory.createForClass(VideoAnalysis);

// Criar índices para busca eficiente
VideoAnalysisSchema.index({ filename: 1 });
VideoAnalysisSchema.index({ tags: 1 });
VideoAnalysisSchema.index({ aiModel: 1 });
VideoAnalysisSchema.index({ createdAt: -1 });
VideoAnalysisSchema.index({
  summary: 'text',
  tags: 'text',
  transcription: 'text',
});
