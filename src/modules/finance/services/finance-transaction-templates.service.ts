import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionTemplate, TransactionTemplateDocument } from '../schemas/finance-transaction-template.schema';
import { ExpenseCategory, ExpenseCategoryDocument } from '../schemas/finance-expense-category.schema';
import { IncomeCategory, IncomeCategoryDocument } from '../schemas/finance-income-category.schema';
import { CreateTransactionTemplateDto } from '../dto/transaction-templates/create-transaction-template.dto';
import { UpdateTransactionTemplateDto } from '../dto/transaction-templates/update-transaction-template.dto';
import { bulkSoftDelete } from '../../portfolio/util/bulk-operations.util';
import { TransactionType } from '../schemas/finance-transaction.schema';

export interface TransactionTemplateFilters {
    type?: TransactionType;
    category?: string;
    search?: string;
    sortBy?: 'usageCount' | 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class FinanceTransactionTemplatesService {
    constructor(
        @InjectModel(TransactionTemplate.name) private transactionTemplateModel: Model<TransactionTemplateDocument>,
        @InjectModel(ExpenseCategory.name) private expenseCategoryModel: Model<ExpenseCategoryDocument>,
        @InjectModel(IncomeCategory.name) private incomeCategoryModel: Model<IncomeCategoryDocument>,
    ) { }

    async create(userId: string, createTemplateDto: CreateTransactionTemplateDto): Promise<TransactionTemplateDocument> {
        // Validate category relationship if categoryId is provided
        if (createTemplateDto.categoryId) {
            await this.validateCategoryRelationship(
                userId,
                createTemplateDto.categoryId,
                createTemplateDto.type,
            );
        }

        // Round amount to 2 decimal places for financial precision
        const roundedAmount = Math.round(createTemplateDto.amount * 100) / 100;

        const template = new this.transactionTemplateModel({
            ...createTemplateDto,
            userId: new Types.ObjectId(userId),
            amount: roundedAmount,
            tags: createTemplateDto.tags || [],
            usageCount: 0,
        });

        return template.save();
    }

    async findAll(userId: string, filters?: TransactionTemplateFilters): Promise<TransactionTemplateDocument[]> {
        const query: any = {
            userId: new Types.ObjectId(userId),
            deletedAt: null,
        };

        if (filters?.type) {
            query.type = filters.type;
        }

        if (filters?.category) {
            query.category = filters.category;
        }

        if (filters?.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
            ];
        }

        // Build sort object
        const sort: any = {};
        if (filters?.sortBy) {
            sort[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
        } else {
            // Default: sort by most used, then by name
            sort.usageCount = -1;
            sort.name = 1;
        }

        return this.transactionTemplateModel.find(query).sort(sort).exec();
    }

    async findOne(userId: string, id: string): Promise<TransactionTemplateDocument> {
        const template = await this.transactionTemplateModel.findById(id).exec();
        if (!template) {
            throw new NotFoundException('Transaction template not found');
        }

        if (template.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own transaction templates');
        }

        return template;
    }

    async update(userId: string, id: string, updateTemplateDto: UpdateTransactionTemplateDto): Promise<TransactionTemplateDocument> {
        const template = await this.findOne(userId, id);

        // Validate category relationship if categoryId is being updated
        if (updateTemplateDto.categoryId !== undefined) {
            const transactionType = updateTemplateDto.type || template.type;
            if (updateTemplateDto.categoryId && updateTemplateDto.categoryId !== '') {
                await this.validateCategoryRelationship(
                    userId,
                    updateTemplateDto.categoryId,
                    transactionType,
                );
            }
        }

        // Round amount if being updated
        if (updateTemplateDto.amount !== undefined) {
            updateTemplateDto.amount = Math.round(updateTemplateDto.amount * 100) / 100;
        }

        Object.assign(template, updateTemplateDto);
        return template.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        const template = await this.findOne(userId, id);
        // Soft delete
        (template as any).deletedAt = new Date();
        await template.save();
    }

    async bulkDelete(userId: string, ids: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.transactionTemplateModel, userId, ids);
    }

    /**
     * Increment usage count and update last used date
     * Called when a template is used to create a transaction
     */
    async incrementUsage(userId: string, id: string): Promise<TransactionTemplateDocument> {
        const template = await this.findOne(userId, id);
        template.usageCount = (template.usageCount || 0) + 1;
        template.lastUsedAt = new Date();
        return template.save();
    }

    /**
     * Validate that the category exists, belongs to the user, and matches the transaction type
     */
    private async validateCategoryRelationship(
        userId: string,
        categoryId: string,
        transactionType: TransactionType,
    ): Promise<void> {
        const categoryObjectId = new Types.ObjectId(categoryId);

        if (transactionType === TransactionType.EXPENSE) {
            const category = await this.expenseCategoryModel.findById(categoryObjectId).exec();
            if (!category) {
                throw new BadRequestException('Expense category not found');
            }
            if (category.userId.toString() !== userId) {
                throw new ForbiddenException('Expense category does not belong to you');
            }
        } else if (transactionType === TransactionType.INCOME) {
            const category = await this.incomeCategoryModel.findById(categoryObjectId).exec();
            if (!category) {
                throw new BadRequestException('Income category not found');
            }
            if (category.userId.toString() !== userId) {
                throw new ForbiddenException('Income category does not belong to you');
            }
        }
    }
}

