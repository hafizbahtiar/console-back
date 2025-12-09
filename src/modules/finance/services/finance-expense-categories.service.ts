import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExpenseCategory, ExpenseCategoryDocument } from '../schemas/finance-expense-category.schema';
import { CreateExpenseCategoryDto } from '../dto/expense-categories/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from '../dto/expense-categories/update-expense-category.dto';
import { bulkSoftDelete } from '../../portfolio/util/bulk-operations.util';

@Injectable()
export class FinanceExpenseCategoriesService {
    constructor(
        @InjectModel(ExpenseCategory.name) private expenseCategoryModel: Model<ExpenseCategoryDocument>,
    ) { }

    async create(userId: string, createExpenseCategoryDto: CreateExpenseCategoryDto): Promise<ExpenseCategoryDocument> {
        // Get the maximum order value for this user to set default order
        const maxOrder = await this.expenseCategoryModel
            .findOne({ userId: new Types.ObjectId(userId) })
            .sort({ order: -1 })
            .exec();

        const order = createExpenseCategoryDto.order !== undefined
            ? createExpenseCategoryDto.order
            : (maxOrder ? maxOrder.order + 1 : 0);

        const category = new this.expenseCategoryModel({
            ...createExpenseCategoryDto,
            userId: new Types.ObjectId(userId),
            order,
        });
        return category.save();
    }

    async findAll(userId: string): Promise<ExpenseCategoryDocument[]> {
        return this.expenseCategoryModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ order: 1, createdAt: 1 })
            .exec();
    }

    async findOne(userId: string, id: string): Promise<ExpenseCategoryDocument> {
        const category = await this.expenseCategoryModel.findById(id).exec();
        if (!category) {
            throw new NotFoundException('Expense category not found');
        }

        if (category.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own expense categories');
        }

        return category;
    }

    async update(userId: string, id: string, updateExpenseCategoryDto: UpdateExpenseCategoryDto): Promise<ExpenseCategoryDocument> {
        const category = await this.findOne(userId, id);
        Object.assign(category, updateExpenseCategoryDto);
        return category.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        const category = await this.findOne(userId, id);
        // Soft delete
        (category as any).deletedAt = new Date();
        await category.save();
    }

    async bulkDelete(userId: string, ids: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.expenseCategoryModel, userId, ids);
    }

    async reorder(userId: string, categoryIds: string[]): Promise<void> {
        // Verify all categories belong to the user
        const categories = await this.expenseCategoryModel.find({
            _id: { $in: categoryIds.map((id) => new Types.ObjectId(id)) },
            userId: new Types.ObjectId(userId),
        }).exec();

        if (categories.length !== categoryIds.length) {
            throw new ForbiddenException('Some expense categories not found or do not belong to you');
        }

        // Update order for each category
        const updatePromises = categoryIds.map((categoryId, index) =>
            this.expenseCategoryModel.findByIdAndUpdate(categoryId, { order: index }).exec(),
        );

        await Promise.all(updatePromises);
    }

    async restore(userId: string, id: string): Promise<ExpenseCategoryDocument> {
        const category = await this.expenseCategoryModel.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
            deletedAt: { $ne: null },
        }).exec();

        if (!category) {
            throw new NotFoundException('Deleted expense category not found');
        }

        (category as any).deletedAt = null;
        return category.save();
    }
}

