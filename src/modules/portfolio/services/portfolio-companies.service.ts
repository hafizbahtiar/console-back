import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from '../schemas/portfolio-company.schema';
import { CreateCompanyDto } from '../dto/companies/create-company.dto';
import { UpdateCompanyDto } from '../dto/companies/update-company.dto';

@Injectable()
export class PortfolioCompaniesService {
    constructor(
        @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    ) { }

    async create(userId: string, createCompanyDto: CreateCompanyDto): Promise<CompanyDocument> {
        const company = new this.companyModel({
            ...createCompanyDto,
            userId: new Types.ObjectId(userId),
        });
        return company.save();
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 10,
        includeDeleted = false,
    ): Promise<{ companies: CompanyDocument[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const queryFilter: any = { userId: new Types.ObjectId(userId) };

        if (!includeDeleted) {
            queryFilter.deletedAt = null;
        }

        const [companies, total] = await Promise.all([
            this.companyModel
                .find(queryFilter)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.companyModel.countDocuments(queryFilter).exec(),
        ]);

        return {
            companies,
            total,
            page,
            limit,
        };
    }

    async findOne(userId: string, id: string): Promise<CompanyDocument> {
        const company = await this.companyModel.findById(id).exec();
        if (!company) {
            throw new NotFoundException('Company not found');
        }

        if (company.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own companies');
        }

        return company;
    }

    async update(userId: string, id: string, updateCompanyDto: UpdateCompanyDto): Promise<CompanyDocument> {
        const company = await this.findOne(userId, id);
        Object.assign(company, updateCompanyDto);
        return company.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        await this.findOne(userId, id);
        await this.companyModel.findByIdAndDelete(id).exec();
    }

    async deleteAllByUserId(userId: string): Promise<number> {
        const result = await this.companyModel.deleteMany({
            userId: new Types.ObjectId(userId),
        }).exec();
        return result.deletedCount || 0;
    }
}
