import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VideoAnalysis,
  VideoAnalysisDocument,
} from '../schemas/video-analysis.schema';

@Injectable()
export class VideoAnalysisService {
  constructor(
    @InjectModel(VideoAnalysis.name)
    private videoAnalysisModel: Model<VideoAnalysisDocument>,
  ) {}

  async createAnalysis(
    analysisData: Partial<VideoAnalysis>,
  ): Promise<VideoAnalysisDocument> {
    const analysis = new this.videoAnalysisModel(analysisData);
    return analysis.save();
  }

  async findByFilename(
    filename: string,
  ): Promise<VideoAnalysisDocument | null> {
    return this.videoAnalysisModel.findOne({ filename }).exec();
  }

  async findAll(): Promise<VideoAnalysisDocument[]> {
    return this.videoAnalysisModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByTags(tags: string[]): Promise<VideoAnalysisDocument[]> {
    return this.videoAnalysisModel.find({ tags: { $in: tags } }).exec();
  }

  async searchByText(query: string): Promise<VideoAnalysisDocument[]> {
    return this.videoAnalysisModel
      .find({
        $text: { $search: query },
      })
      .exec();
  }

  async deleteByFilename(filename: string): Promise<void> {
    await this.videoAnalysisModel.deleteOne({ filename }).exec();
  }

  async updateAnalysis(
    filename: string,
    updateData: Partial<VideoAnalysis>,
  ): Promise<VideoAnalysisDocument | null> {
    return this.videoAnalysisModel
      .findOneAndUpdate({ filename }, updateData, { new: true })
      .exec();
  }
}
