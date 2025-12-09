import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IncomeCategory, IncomeCategoryDocument } from '../schemas/finance-income-category.schema';
import { CreateIncomeCategoryDto } from '../dto/income-categories/create-income-category.dto';
import { UpdateIncomeCategoryDto } from '../dto/income-categories/update-income-category.dto';
import { bulkSoftDelete } from '../../portfolio/util/bulk-operations.util';

@Injectable()
export class FinanceIncomeCategoriesService {
    constructor(
        @InjectModel(IncomeCategory.name) private incomeCategoryModel: Model<IncomeCategoryDocument>,
    ) { }

    async create(userId: string, createIncomeCategoryDto: CreateIncomeCategoryDto): Promise<IncomeCategoryDocument> {
        // Get the maximum order value for this user to set default order
        const maxOrder = await this.incomeCategoryModel
            .findOne({ userId: new Types.ObjectId(userId) })
            .sort({ order: -1 })
            .exec();

        const order = createIncomeCategoryDto.order !== undefined
            ? createIncomeCategoryDto.order
            : (maxOrder ? maxOrder.order + 1 : 0);

        const category = new this.incomeCategoryModel({
            ...createIncomeCategoryDto,
            userId: new Types.ObjectId(userId),
            order,
        });
        return category.save();
    }

    async findAll(userId: string): Promise<IncomeCategoryDocument[]> {
        return this.incomeCategoryModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ order: 1, createdAt: 1 })
            .exec();
    }

    async findOne(userId: string, id: string): Promise<IncomeCategoryDocument> {
        const category = await this.incomeCategoryModel.findById(id).exec();
        if (!category) {
            throw new NotFoundException('Income category not found');
        }

        if (category.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own income categories');
        }

        return category;
    }

    async update(userId: string, id: string, updateIncomeCategoryDto: UpdateIncomeCategoryDto): Promise<IncomeCategoryDocument> {
        const category = await this.findOne(userId, id);
        Object.assign(category, updateIncomeCategoryDto);
        return category.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        const category = await this.findOne(userId, id);
        // Soft delete
        (category as any).deletedAt = new Date();
        await category.save();
    }

    async bulkDelete(userId: string, ids: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.incomeCategoryModel, userId, ids);
    }

    async reorder(userId: string, categoryIds: string[]): Promise<void> {
        // Verify all categories belong to the user
        const categories = await this.incomeCategoryModel.find({
            _id: { $in: categoryIds.map((id) => new Types.ObjectId(id)) },
            userId: new Types.ObjectId(userId),
        }).exec();

        if (categories.length !== categoryIds.length) {
            throw new ForbiddenException('Some income categories not found or do not belong to you');
        }

        // Update order for each category
        const updatePromises = categoryIds.map((categoryId, index) =>
            this.incomeCategoryModel.findByIdAndUpdate(categoryId, { order: index }).exec(),
        );

        await Promise.all(updatePromises);
    }

    async restore(userId: string, id: string): Promise<IncomeCategoryDocument> {
        const category = await this.incomeCategoryModel.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
            deletedAt: { $ne: null },
        }).exec();

        if (!category) {
            throw new NotFoundException('Deleted income category not found');
        }

        (category as any).deletedAt = null;
        return category.save();
    }
}

