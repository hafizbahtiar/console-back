import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Experience, ExperienceDocument } from '../schemas/portfolio-experience.schema';
import { CreateExperienceDto } from '../dto/experiences/create-experience.dto';
import { UpdateExperienceDto } from '../dto/experiences/update-experience.dto';

@Injectable()
export class PortfolioExperiencesService {
    constructor(
        @InjectModel(Experience.name) private experienceModel: Model<ExperienceDocument>,
    ) { }

    async create(userId: string, createExperienceDto: CreateExperienceDto): Promise<ExperienceDocument> {
        // Validate date logic
        if (createExperienceDto.startDate && createExperienceDto.endDate) {
            const start = new Date(createExperienceDto.startDate);
            const end = new Date(createExperienceDto.endDate);
            if (start > end) {
                throw new BadRequestException('Start date must be before end date');
            }
        }

        // If current is true, endDate should be null
        if (createExperienceDto.current && createExperienceDto.endDate) {
            throw new BadRequestException('Current experience cannot have an end date');
        }

        const experience = new this.experienceModel({
            ...createExperienceDto,
            userId: new Types.ObjectId(userId),
            companyId: createExperienceDto.companyId ? new Types.ObjectId(createExperienceDto.companyId) : undefined,
            startDate: new Date(createExperienceDto.startDate),
            endDate: createExperienceDto.endDate ? new Date(createExperienceDto.endDate) : undefined,
        });
        const saved = await experience.save();

        // Populate company if it exists
        if (saved.companyId) {
            await saved.populate({
                path: 'companyId',
                select: 'name logo website industry location',
            });
        }

        return saved;
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 10,
        populateCompany = true,
        includeDeleted = false,
    ): Promise<{ experiences: ExperienceDocument[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const queryFilter: any = { userId: new Types.ObjectId(userId) };

        if (!includeDeleted) {
            queryFilter.deletedAt = null;
        }

        const query = this.experienceModel
            .find(queryFilter)
            .sort({ startDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        if (populateCompany) {
            query.populate({
                path: 'companyId',
                select: 'name logo website industry location',
            });
        }

        const [experiences, total] = await Promise.all([
            query.exec(),
            this.experienceModel.countDocuments(queryFilter).exec(),
        ]);

        return {
            experiences,
            total,
            page,
            limit,
        };
    }

    async findOne(userId: string, id: string, populateCompany = true): Promise<ExperienceDocument> {
        const query = this.experienceModel.findById(id);

        if (populateCompany) {
            query.populate({
                path: 'companyId',
                select: 'name logo website industry location',
            });
        }

        const experience = await query.exec();
        if (!experience) {
            throw new NotFoundException('Experience not found');
        }

        if (experience.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own experiences');
        }

        return experience;
    }

    async update(userId: string, id: string, updateExperienceDto: UpdateExperienceDto): Promise<ExperienceDocument> {
        const experience = await this.findOne(userId, id, false);

        // Validate date logic
        const startDate = updateExperienceDto.startDate ? new Date(updateExperienceDto.startDate) : experience.startDate;
        const endDate = updateExperienceDto.endDate ? new Date(updateExperienceDto.endDate) : experience.endDate;
        const current = updateExperienceDto.current !== undefined ? updateExperienceDto.current : experience.current;

        if (startDate && endDate && startDate > endDate) {
            throw new BadRequestException('Start date must be before end date');
        }

        if (current && endDate) {
            throw new BadRequestException('Current experience cannot have an end date');
        }

        // Convert date strings to Date objects if provided
        const updateData: any = { ...updateExperienceDto };
        if (updateExperienceDto.startDate) {
            updateData.startDate = new Date(updateExperienceDto.startDate);
        }
        if (updateExperienceDto.endDate) {
            updateData.endDate = new Date(updateExperienceDto.endDate);
        }
        if (updateExperienceDto.companyId) {
            updateData.companyId = new Types.ObjectId(updateExperienceDto.companyId);
        }

        Object.assign(experience, updateData);
        const saved = await experience.save();

        // Populate company if it exists
        if (saved.companyId) {
            await saved.populate({
                path: 'companyId',
                select: 'name logo website industry location',
            });
        }

        return saved;
    }

    async remove(userId: string, id: string): Promise<void> {
        const experience = await this.findOne(userId, id, false);
        // Soft delete
        (experience as any).deletedAt = new Date();
        await experience.save();
    }

    async deleteAllByUserId(userId: string): Promise<number> {
        const result = await this.experienceModel.deleteMany({
            userId: new Types.ObjectId(userId),
        }).exec();
        return result.deletedCount || 0;
    }
}
