import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranscriptionService } from './transcription/transcription.service';
import { AiService } from './ai/ai.service';
import { VideoAnalysisService } from './video-analysis/video-analysis.service';
import {
  VideoAnalysis,
  VideoAnalysisSchema,
} from './schemas/video-analysis.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/titulyzer',
    ),
    MongooseModule.forFeature([
      { name: VideoAnalysis.name, schema: VideoAnalysisSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TranscriptionService,
    AiService,
    VideoAnalysisService,
  ],
})
export class AppModule {}
