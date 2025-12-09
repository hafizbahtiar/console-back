import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    RecurringTransaction,
    RecurringTransactionDocument,
    RecurringFrequency,
} from '../schemas/finance-recurring-transaction.schema';
import { Transaction, TransactionDocument } from '../schemas/finance-transaction.schema';
import { ExpenseCategory, ExpenseCategoryDocument } from '../schemas/finance-expense-category.schema';
import { IncomeCategory, IncomeCategoryDocument } from '../schemas/finance-income-category.schema';
import { CreateRecurringTransactionDto } from '../dto/recurring-transactions/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from '../dto/recurring-transactions/update-recurring-transaction.dto';
import { bulkSoftDelete } from '../../portfolio/util/bulk-operations.util';
import { getDefaultCurrency } from '../common/currency-codes';

export interface RecurringTransactionFilters {
    frequency?: RecurringFrequency;
    isActive?: boolean;
    search?: string;
}

@Injectable()
export class FinanceRecurringTransactionsService {
    constructor(
        @InjectModel(RecurringTransaction.name)
        private recurringTransactionModel: Model<RecurringTransactionDocument>,
        @InjectModel(Transaction.name)
        private transactionModel: Model<TransactionDocument>,
        @InjectModel(ExpenseCategory.name)
        private expenseCategoryModel: Model<ExpenseCategoryDocument>,
        @InjectModel(IncomeCategory.name)
        private incomeCategoryModel: Model<IncomeCategoryDocument>,
    ) { }

    /**
     * Calculate next run date based on frequency, interval, and current date
     */
    private calculateNextRunDate(
        frequency: RecurringFrequency,
        interval: number,
        fromDate: Date,
    ): Date {
        const nextDate = new Date(fromDate);

        switch (frequency) {
            case RecurringFrequency.DAILY:
                nextDate.setDate(nextDate.getDate() + interval);
                break;
            case RecurringFrequency.WEEKLY:
                nextDate.setDate(nextDate.getDate() + (7 * interval));
                break;
            case RecurringFrequency.MONTHLY:
                nextDate.setMonth(nextDate.getMonth() + interval);
                break;
            case RecurringFrequency.YEARLY:
                nextDate.setFullYear(nextDate.getFullYear() + interval);
                break;
            case RecurringFrequency.CUSTOM:
                // For custom, interval is in days
                nextDate.setDate(nextDate.getDate() + interval);
                break;
            default:
                throw new BadRequestException(`Invalid frequency: ${frequency}`);
        }

        return nextDate;
    }

    /**
     * Validate frequency and interval
     */
    private validateFrequencyAndInterval(
        frequency: RecurringFrequency,
        interval?: number,
    ): void {
        if (frequency === RecurringFrequency.CUSTOM) {
            if (!interval || interval < 1) {
                throw new BadRequestException(
                    'Interval is required and must be at least 1 when frequency is custom',
                );
            }
        }
    }

    /**
     * Validate date range
     */
    private validateDateRange(startDate: Date, endDate?: Date): void {
        if (isNaN(startDate.getTime())) {
            throw new BadRequestException('Invalid start date format');
        }

        if (endDate) {
            if (isNaN(endDate.getTime())) {
                throw new BadRequestException('Invalid end date format');
            }
            if (endDate < startDate) {
                throw new BadRequestException('End date must be after start date');
            }
        }
    }

    /**
     * Validate category relationship (same as transaction service)
     */
    private async validateCategoryRelationship(
        userId: string,
        categoryId: string,
        type: 'expense' | 'income',
    ): Promise<void> {
        const categoryModel = type === 'expense' ? this.expenseCategoryModel : this.incomeCategoryModel;
        const category = await categoryModel
            .findOne({
                _id: new Types.ObjectId(categoryId),
                userId: new Types.ObjectId(userId),
                deletedAt: null,
            })
            .exec();

        if (!category) {
            throw new NotFoundException(
                `${type === 'expense' ? 'Expense' : 'Income'} category not found or does not belong to you`,
            );
        }
    }

    async create(
        userId: string,
        createRecurringTransactionDto: CreateRecurringTransactionDto,
    ): Promise<RecurringTransactionDocument> {
        // Validate frequency and interval
        this.validateFrequencyAndInterval(
            createRecurringTransactionDto.frequency,
            createRecurringTransactionDto.interval,
        );

        // Parse and validate dates
        const startDate = new Date(createRecurringTransactionDto.startDate);
        const endDate = createRecurringTransactionDto.endDate
            ? new Date(createRecurringTransactionDto.endDate)
            : undefined;

        this.validateDateRange(startDate, endDate);

        // Validate category relationship if categoryId is provided
        if (createRecurringTransactionDto.template.categoryId) {
            await this.validateCategoryRelationship(
                userId,
                createRecurringTransactionDto.template.categoryId,
                createRecurringTransactionDto.template.type,
            );
        }

        // Round amount to 2 decimal places
        const amount = Math.round(createRecurringTransactionDto.template.amount * 100) / 100;

        // Calculate next run date (initially same as start date, will be updated after first generation)
        const nextRunDate = new Date(startDate);

        // Create recurring transaction
        const recurringTransaction = new this.recurringTransactionModel({
            userId: new Types.ObjectId(userId),
            template: {
                ...createRecurringTransactionDto.template,
                amount,
                categoryId: createRecurringTransactionDto.template.categoryId
                    ? new Types.ObjectId(createRecurringTransactionDto.template.categoryId)
                    : undefined,
            },
            frequency: createRecurringTransactionDto.frequency,
            interval: createRecurringTransactionDto.interval || 1,
            startDate,
            endDate,
            nextRunDate,
            isActive: createRecurringTransactionDto.isActive !== undefined
                ? createRecurringTransactionDto.isActive
                : true,
            runCount: 0,
        });

        return recurringTransaction.save();
    }

    async findAll(
        userId: string,
        filters?: RecurringTransactionFilters,
    ): Promise<RecurringTransactionDocument[]> {
        const query: any = { userId: new Types.ObjectId(userId) };

        // Apply filters
        if (filters) {
            if (filters.frequency) {
                query.frequency = filters.frequency;
            }

            if (filters.isActive !== undefined) {
                query.isActive = filters.isActive;
            }

            if (filters.search) {
                query.$or = [
                    { 'template.description': { $regex: filters.search, $options: 'i' } },
                    { 'template.notes': { $regex: filters.search, $options: 'i' } },
                    { 'template.reference': { $regex: filters.search, $options: 'i' } },
                ];
            }
        }

        return this.recurringTransactionModel.find(query).sort({ createdAt: -1 }).exec();
    }

    /**
     * Find all recurring transactions that are due for generation
     * Used by the cron job to find transactions that need to be generated
     */
    async findDueRecurringTransactions(asOfDate?: Date): Promise<RecurringTransactionDocument[]> {
        const date = asOfDate || new Date();
        // Set time to end of day for comparison (so we catch all transactions due today)
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const query: any = {
            isActive: true,
            deletedAt: null,
            // nextRunDate is today or in the past
            nextRunDate: { $lte: endOfDay },
            // If endDate exists, it should be in the future or today (not in the past)
            $or: [
                { endDate: null },
                { endDate: { $gte: date } },
            ],
        };

        return this.recurringTransactionModel.find(query).exec();
    }

    async findOne(userId: string, id: string): Promise<RecurringTransactionDocument> {
        const recurringTransaction = await this.recurringTransactionModel.findById(id).exec();
        if (!recurringTransaction) {
            throw new NotFoundException('Recurring transaction not found');
        }

        if (recurringTransaction.userId.toString() !== userId) {
            throw new ForbiddenException('You can only access your own recurring transactions');
        }

        return recurringTransaction;
    }

    async update(
        userId: string,
        id: string,
        updateRecurringTransactionDto: UpdateRecurringTransactionDto,
    ): Promise<RecurringTransactionDocument> {
        const recurringTransaction = await this.findOne(userId, id);

        // Validate frequency and interval if being updated
        if (updateRecurringTransactionDto.frequency !== undefined) {
            const frequency = updateRecurringTransactionDto.frequency;
            const interval =
                updateRecurringTransactionDto.interval !== undefined
                    ? updateRecurringTransactionDto.interval
                    : recurringTransaction.interval;
            this.validateFrequencyAndInterval(frequency, interval);
        } else if (updateRecurringTransactionDto.interval !== undefined) {
            this.validateFrequencyAndInterval(recurringTransaction.frequency, updateRecurringTransactionDto.interval);
        }

        // Parse and validate dates if being updated
        let startDate = recurringTransaction.startDate;
        let endDate = recurringTransaction.endDate;

        if (updateRecurringTransactionDto.startDate) {
            startDate = new Date(updateRecurringTransactionDto.startDate);
        }
        if (updateRecurringTransactionDto.endDate !== undefined) {
            endDate = updateRecurringTransactionDto.endDate
                ? new Date(updateRecurringTransactionDto.endDate)
                : undefined;
        }

        this.validateDateRange(startDate, endDate);

        // Validate category relationship if template.categoryId is being updated
        if (updateRecurringTransactionDto.template?.categoryId !== undefined) {
            const transactionType =
                updateRecurringTransactionDto.template.type ||
                recurringTransaction.template.type;
            if (updateRecurringTransactionDto.template.categoryId && updateRecurringTransactionDto.template.categoryId !== '') {
                await this.validateCategoryRelationship(
                    userId,
                    updateRecurringTransactionDto.template.categoryId,
                    transactionType,
                );
            }
        }

        // Update template if provided
        if (updateRecurringTransactionDto.template) {
            const templateUpdate: any = { ...recurringTransaction.template };

            if (updateRecurringTransactionDto.template.amount !== undefined) {
                templateUpdate.amount = Math.round(updateRecurringTransactionDto.template.amount * 100) / 100;
            }
            if (updateRecurringTransactionDto.template.description !== undefined) {
                templateUpdate.description = updateRecurringTransactionDto.template.description;
            }
            if (updateRecurringTransactionDto.template.type !== undefined) {
                templateUpdate.type = updateRecurringTransactionDto.template.type;
            }
            if (updateRecurringTransactionDto.template.categoryId !== undefined) {
                templateUpdate.categoryId = updateRecurringTransactionDto.template.categoryId
                    ? new Types.ObjectId(updateRecurringTransactionDto.template.categoryId)
                    : undefined;
            }
            if (updateRecurringTransactionDto.template.notes !== undefined) {
                templateUpdate.notes = updateRecurringTransactionDto.template.notes;
            }
            if (updateRecurringTransactionDto.template.tags !== undefined) {
                templateUpdate.tags = updateRecurringTransactionDto.template.tags;
            }
            if (updateRecurringTransactionDto.template.paymentMethod !== undefined) {
                templateUpdate.paymentMethod = updateRecurringTransactionDto.template.paymentMethod;
            }
            if (updateRecurringTransactionDto.template.reference !== undefined) {
                templateUpdate.reference = updateRecurringTransactionDto.template.reference;
            }

            recurringTransaction.template = templateUpdate;
        }

        // Update other fields
        if (updateRecurringTransactionDto.frequency !== undefined) {
            recurringTransaction.frequency = updateRecurringTransactionDto.frequency;
        }
        if (updateRecurringTransactionDto.interval !== undefined) {
            recurringTransaction.interval = updateRecurringTransactionDto.interval;
        }
        if (updateRecurringTransactionDto.startDate) {
            recurringTransaction.startDate = startDate;
        }
        if (updateRecurringTransactionDto.endDate !== undefined) {
            recurringTransaction.endDate = endDate;
        }
        if (updateRecurringTransactionDto.isActive !== undefined) {
            recurringTransaction.isActive = updateRecurringTransactionDto.isActive;
        }

        // Recalculate nextRunDate if frequency, interval, or startDate changed
        if (
            updateRecurringTransactionDto.frequency !== undefined ||
            updateRecurringTransactionDto.interval !== undefined ||
            updateRecurringTransactionDto.startDate
        ) {
            recurringTransaction.nextRunDate = this.calculateNextRunDate(
                recurringTransaction.frequency,
                recurringTransaction.interval,
                recurringTransaction.startDate,
            );
        }

        return recurringTransaction.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        const recurringTransaction = await this.findOne(userId, id);
        (recurringTransaction as any).deletedAt = new Date();
        await recurringTransaction.save();
    }

    async bulkDelete(
        userId: string,
        ids: string[],
    ): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.recurringTransactionModel, userId, ids);
    }

    /**
     * Generate transactions from recurring transaction
     * This is called by the cron job or manually
     */
    async generateTransactions(
        userId: string,
        id: string,
        generateUntilDate?: Date,
    ): Promise<{ generatedCount: number; transactions: TransactionDocument[] }> {
        const recurringTransaction = await this.findOne(userId, id);

        if (!recurringTransaction.isActive) {
            throw new BadRequestException('Cannot generate transactions for inactive recurring transaction');
        }

        const now = generateUntilDate || new Date();
        const transactions: TransactionDocument[] = [];
        let currentDate = new Date(recurringTransaction.nextRunDate);
        let generatedCount = 0;

        // Generate transactions until we reach the end date or today
        while (currentDate <= now) {
            // Check if we've passed the end date
            if (recurringTransaction.endDate && currentDate > recurringTransaction.endDate) {
                break;
            }

            // Check if current date is before start date
            if (currentDate < recurringTransaction.startDate) {
                currentDate = this.calculateNextRunDate(
                    recurringTransaction.frequency,
                    recurringTransaction.interval,
                    currentDate,
                );
                continue;
            }

            // Create transaction from template
            const transaction = new this.transactionModel({
                userId: recurringTransaction.userId,
                amount: recurringTransaction.template.amount,
                date: new Date(currentDate),
                description: recurringTransaction.template.description,
                type: recurringTransaction.template.type,
                categoryId: recurringTransaction.template.categoryId,
                notes: recurringTransaction.template.notes,
                tags: recurringTransaction.template.tags || [],
                paymentMethod: recurringTransaction.template.paymentMethod,
                reference: recurringTransaction.template.reference,
                recurringTransactionId: recurringTransaction._id, // Link to the recurring transaction
                currency: getDefaultCurrency(), // Default to MYR for recurring transactions
                baseCurrency: getDefaultCurrency(), // Default to MYR
            });

            const savedTransaction = await transaction.save();
            transactions.push(savedTransaction);
            generatedCount++;

            // Update recurring transaction
            recurringTransaction.lastRunDate = new Date(currentDate);
            recurringTransaction.runCount += 1;

            // Calculate next run date
            currentDate = this.calculateNextRunDate(
                recurringTransaction.frequency,
                recurringTransaction.interval,
                currentDate,
            );

            // If next run date is after end date, deactivate
            if (recurringTransaction.endDate && currentDate > recurringTransaction.endDate) {
                recurringTransaction.isActive = false;
                break;
            }
        }

        // Update next run date
        recurringTransaction.nextRunDate = currentDate;
        await recurringTransaction.save();

        return { generatedCount, transactions };
    }

    /**
     * Pause recurring transaction
     */
    async pause(userId: string, id: string): Promise<RecurringTransactionDocument> {
        const recurringTransaction = await this.findOne(userId, id);
        recurringTransaction.isActive = false;
        return recurringTransaction.save();
    }

    /**
     * Resume recurring transaction
     */
    async resume(userId: string, id: string): Promise<RecurringTransactionDocument> {
        const recurringTransaction = await this.findOne(userId, id);
        recurringTransaction.isActive = true;
        return recurringTransaction.save();
    }

    /**
     * Skip next occurrence
     */
    async skipNext(userId: string, id: string): Promise<RecurringTransactionDocument> {
        const recurringTransaction = await this.findOne(userId, id);
        recurringTransaction.nextRunDate = this.calculateNextRunDate(
            recurringTransaction.frequency,
            recurringTransaction.interval,
            recurringTransaction.nextRunDate,
        );
        return recurringTransaction.save();
    }

    /**
     * Edit future occurrences
     * This creates a new recurring transaction starting from the next run date
     * and optionally ends the current one
     */
    async editFuture(
        userId: string,
        id: string,
        updateDto: UpdateRecurringTransactionDto,
        endCurrent: boolean = true,
    ): Promise<{ current: RecurringTransactionDocument; new?: RecurringTransactionDocument }> {
        const current = await this.findOne(userId, id);

        // End current recurring transaction at next run date
        if (endCurrent) {
            current.endDate = new Date(current.nextRunDate);
            current.isActive = false;
            await current.save();
        }

        // Create new recurring transaction starting from next run date
        const newStartDate = new Date(current.nextRunDate);
        const newRecurringTransaction = new this.recurringTransactionModel({
            userId: current.userId,
            template: {
                ...current.template,
                ...(updateDto.template || {}),
                amount: updateDto.template?.amount !== undefined
                    ? Math.round(updateDto.template.amount * 100) / 100
                    : current.template.amount,
                categoryId: updateDto.template?.categoryId
                    ? new Types.ObjectId(updateDto.template.categoryId)
                    : current.template.categoryId,
            },
            frequency: updateDto.frequency || current.frequency,
            interval: updateDto.interval !== undefined ? updateDto.interval : current.interval,
            startDate: newStartDate,
            endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
            nextRunDate: this.calculateNextRunDate(
                updateDto.frequency || current.frequency,
                updateDto.interval !== undefined ? updateDto.interval : current.interval,
                newStartDate,
            ),
            isActive: updateDto.isActive !== undefined ? updateDto.isActive : true,
            runCount: 0,
        });

        const saved = await newRecurringTransaction.save();

        return { current, new: saved };
    }
}

