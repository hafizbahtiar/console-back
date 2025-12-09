import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Education, EducationDocument } from '../schemas/portfolio-education.schema';
import { CreateEducationDto } from '../dto/education/create-education.dto';
import { UpdateEducationDto } from '../dto/education/update-education.dto';
import { bulkSoftDelete } from '../util/bulk-operations.util';

@Injectable()
export class PortfolioEducationService {
    constructor(
        @InjectModel(Education.name) private educationModel: Model<EducationDocument>,
    ) { }

    async create(userId: string, createEducationDto: CreateEducationDto): Promise<EducationDocument> {
        // Validate date logic
        if (createEducationDto.startDate && createEducationDto.endDate) {
            const start = new Date(createEducationDto.startDate);
            const end = new Date(createEducationDto.endDate);
            if (start > end) {
                throw new BadRequestException('Start date must be before end date');
            }
        }

        const education = new this.educationModel({
            ...createEducationDto,
            userId: new Types.ObjectId(userId),
            startDate: new Date(createEducationDto.startDate),
            endDate: createEducationDto.endDate ? new Date(createEducationDto.endDate) : undefined,
        });
        return education.save();
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 10,
        includeDeleted = false,
    ): Promise<{ education: EducationDocument[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const queryFilter: any = { userId: new Types.ObjectId(userId) };

        if (!includeDeleted) {
            queryFilter.deletedAt = null;
        }

        const [education, total] = await Promise.all([
            this.educationModel
                .find(queryFilter)
                .sort({ startDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.educationModel.countDocuments(queryFilter).exec(),
        ]);

        return {
            education,
            total,
            page,
            limit,
        };
    }

    async findOne(userId: string, id: string): Promise<EducationDocument> {
        const education = await this.educationModel.findById(id).exec();
        if (!education) {
            throw new NotFoundException('Education entry not found');
        }

        if (education.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own education entries');
        }

        return education;
    }

    async update(userId: string, id: string, updateEducationDto: UpdateEducationDto): Promise<EducationDocument> {
        const education = await this.findOne(userId, id);

        // Validate date logic
        const startDate = updateEducationDto.startDate ? new Date(updateEducationDto.startDate) : education.startDate;
        const endDate = updateEducationDto.endDate ? new Date(updateEducationDto.endDate) : education.endDate;

        if (startDate && endDate && startDate > endDate) {
            throw new BadRequestException('Start date must be before end date');
        }

        // Convert date strings to Date objects if provided
        const updateData: any = { ...updateEducationDto };
        if (updateEducationDto.startDate) {
            updateData.startDate = new Date(updateEducationDto.startDate);
        }
        if (updateEducationDto.endDate) {
            updateData.endDate = new Date(updateEducationDto.endDate);
        }

        Object.assign(education, updateData);
        return education.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        const education = await this.findOne(userId, id);
        // Soft delete
        (education as any).deletedAt = new Date();
        await education.save();
    }

    async bulkDelete(userId: string, ids: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.educationModel, userId, ids);
    }

    async deleteAllByUserId(userId: string): Promise<number> {
        const result = await this.educationModel.deleteMany({
            userId: new Types.ObjectId(userId),
        }).exec();
        return result.deletedCount || 0;
    }
}
