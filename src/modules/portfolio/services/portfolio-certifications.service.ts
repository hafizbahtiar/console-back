import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Certification, CertificationDocument } from '../schemas/portfolio-certification.schema';
import { CreateCertificationDto } from '../dto/certifications/create-certification.dto';
import { UpdateCertificationDto } from '../dto/certifications/update-certification.dto';

@Injectable()
export class PortfolioCertificationsService {
    constructor(
        @InjectModel(Certification.name) private certificationModel: Model<CertificationDocument>,
    ) { }

    async create(userId: string, createCertificationDto: CreateCertificationDto): Promise<CertificationDocument> {
        // Validate date logic
        if (createCertificationDto.issueDate && createCertificationDto.expiryDate) {
            const issue = new Date(createCertificationDto.issueDate);
            const expiry = new Date(createCertificationDto.expiryDate);
            if (issue > expiry) {
                throw new BadRequestException('Issue date must be before expiry date');
            }
        }

        const certification = new this.certificationModel({
            ...createCertificationDto,
            userId: new Types.ObjectId(userId),
            issueDate: new Date(createCertificationDto.issueDate),
            expiryDate: createCertificationDto.expiryDate ? new Date(createCertificationDto.expiryDate) : undefined,
        });
        return certification.save();
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 10,
        includeDeleted = false,
    ): Promise<{ certifications: CertificationDocument[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const queryFilter: any = { userId: new Types.ObjectId(userId) };

        if (!includeDeleted) {
            queryFilter.deletedAt = null;
        }

        const [certifications, total] = await Promise.all([
            this.certificationModel
                .find(queryFilter)
                .sort({ issueDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.certificationModel.countDocuments(queryFilter).exec(),
        ]);

        return {
            certifications,
            total,
            page,
            limit,
        };
    }

    async findOne(userId: string, id: string): Promise<CertificationDocument> {
        const certification = await this.certificationModel.findById(id).exec();
        if (!certification) {
            throw new NotFoundException('Certification not found');
        }

        if (certification.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own certifications');
        }

        return certification;
    }

    async update(userId: string, id: string, updateCertificationDto: UpdateCertificationDto): Promise<CertificationDocument> {
        const certification = await this.findOne(userId, id);

        // Validate date logic
        const issueDate = updateCertificationDto.issueDate ? new Date(updateCertificationDto.issueDate) : certification.issueDate;
        const expiryDate = updateCertificationDto.expiryDate ? new Date(updateCertificationDto.expiryDate) : certification.expiryDate;

        if (issueDate && expiryDate && issueDate > expiryDate) {
            throw new BadRequestException('Issue date must be before expiry date');
        }

        // Convert date strings to Date objects if provided
        const updateData: any = { ...updateCertificationDto };
        if (updateCertificationDto.issueDate) {
            updateData.issueDate = new Date(updateCertificationDto.issueDate);
        }
        if (updateCertificationDto.expiryDate) {
            updateData.expiryDate = new Date(updateCertificationDto.expiryDate);
        }

        Object.assign(certification, updateData);
        return certification.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        await this.findOne(userId, id);
        await this.certificationModel.findByIdAndDelete(id).exec();
    }

    async deleteAllByUserId(userId: string): Promise<number> {
        const result = await this.certificationModel.deleteMany({
            userId: new Types.ObjectId(userId),
        }).exec();
        return result.deletedCount || 0;
    }
}
