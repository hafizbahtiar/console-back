import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PortfolioProfile, PortfolioProfileDocument } from '../schemas/portfolio-profile.schema';
import { UpdatePortfolioProfileDto } from '../dto/profile/update-portfolio-profile.dto';

@Injectable()
export class PortfolioProfileService {
  constructor(
    @InjectModel(PortfolioProfile.name)
    private readonly portfolioProfileModel: Model<PortfolioProfileDocument>,
  ) { }

  async getByUserId(userId: string): Promise<PortfolioProfileDocument> {
    const userObjectId = new Types.ObjectId(userId);

    let profile = await this.portfolioProfileModel.findOne({ userId: userObjectId }).exec();

    if (!profile) {
      profile = new this.portfolioProfileModel({ userId: userObjectId });
      await profile.save();
    }

    return profile;
  }

  async updateByUserId(
    userId: string,
    updateDto: UpdatePortfolioProfileDto,
  ): Promise<PortfolioProfileDocument> {
    const userObjectId = new Types.ObjectId(userId);

    const cleanedUpdate: Partial<UpdatePortfolioProfileDto> = Object.fromEntries(
      Object.entries(updateDto).filter(([, value]) => value !== undefined),
    ) as UpdatePortfolioProfileDto;

    const profile = await this.portfolioProfileModel
      .findOneAndUpdate(
        { userId: userObjectId },
        { $set: cleanedUpdate, $setOnInsert: { userId: userObjectId } },
        { new: true, upsert: true },
      )
      .exec();

    return profile;
  }

  async updateAvatar(userId: string, avatar: string): Promise<PortfolioProfileDocument> {
    return this.updateByUserId(userId, { avatar });
  }

  async updateResume(userId: string, resumeUrl: string): Promise<PortfolioProfileDocument> {
    return this.updateByUserId(userId, { resumeUrl });
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);
    const result = await this.portfolioProfileModel.deleteOne({ userId: userObjectId }).exec();
    return (result.deletedCount || 0) > 0;
  }
}
