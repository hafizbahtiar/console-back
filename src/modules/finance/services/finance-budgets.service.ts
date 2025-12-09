import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument, BudgetPeriod } from '../schemas/finance-budget.schema';
import { Transaction, TransactionDocument, TransactionType } from '../schemas/finance-transaction.schema';
import { ExpenseCategory, ExpenseCategoryDocument } from '../schemas/finance-expense-category.schema';
import { IncomeCategory, IncomeCategoryDocument } from '../schemas/finance-income-category.schema';
import { CreateBudgetDto } from '../dto/budgets/create-budget.dto';
import { UpdateBudgetDto } from '../dto/budgets/update-budget.dto';
import { bulkSoftDelete } from '../../portfolio/util/bulk-operations.util';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';

export interface BudgetFilters {
    period?: BudgetPeriod;
    categoryId?: string;
    categoryType?: 'ExpenseCategory' | 'IncomeCategory';
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface BudgetSortOptions {
    field?: 'name' | 'amount' | 'startDate' | 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
}

export interface BudgetStats {
    budgetId: string;
    budgetAmount: number;
    actualAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    alertLevel: 'none' | 'warning' | 'critical' | 'exceeded';
    periodStart: Date;
    periodEnd: Date;
}

@Injectable()
export class FinanceBudgetsService {
    constructor(
        @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(ExpenseCategory.name) private expenseCategoryModel: Model<ExpenseCategoryDocument>,
        @InjectModel(IncomeCategory.name) private incomeCategoryModel: Model<IncomeCategoryDocument>,
    ) { }

    async create(userId: string, createBudgetDto: CreateBudgetDto): Promise<BudgetDocument> {
        // Validate date
        const startDate = new Date(createBudgetDto.startDate);
        if (isNaN(startDate.getTime())) {
            throw new BadRequestException('Invalid start date format');
        }

        if (createBudgetDto.endDate) {
            const endDate = new Date(createBudgetDto.endDate);
            if (isNaN(endDate.getTime())) {
                throw new BadRequestException('Invalid end date format');
            }
            if (endDate <= startDate) {
                throw new BadRequestException('End date must be after start date');
            }
        }

        // Validate category if provided
        if (createBudgetDto.categoryId && createBudgetDto.categoryType) {
            await this.validateCategory(userId, createBudgetDto.categoryId, createBudgetDto.categoryType);
        }

        // Validate alert thresholds
        if (createBudgetDto.alertThresholds) {
            const { warning, critical, exceeded } = createBudgetDto.alertThresholds;
            if (warning && (warning < 0 || warning > 100)) {
                throw new BadRequestException('Warning threshold must be between 0 and 100');
            }
            if (critical && (critical < 0 || critical > 100)) {
                throw new BadRequestException('Critical threshold must be between 0 and 100');
            }
            if (exceeded && (exceeded < 0 || exceeded > 100)) {
                throw new BadRequestException('Exceeded threshold must be between 0 and 100');
            }
            if (warning && critical && warning >= critical) {
                throw new BadRequestException('Warning threshold must be less than critical threshold');
            }
            if (critical && exceeded && critical >= exceeded) {
                throw new BadRequestException('Critical threshold must be less than exceeded threshold');
            }
        }

        const budget = new this.budgetModel({
            userId: new Types.ObjectId(userId),
            ...createBudgetDto,
            startDate,
            endDate: createBudgetDto.endDate ? new Date(createBudgetDto.endDate) : undefined,
            categoryId: createBudgetDto.categoryId ? new Types.ObjectId(createBudgetDto.categoryId) : undefined,
        });

        return budget.save();
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 20,
        filters?: BudgetFilters,
        sortOptions?: BudgetSortOptions,
    ): Promise<{ budgets: BudgetDocument[]; total: number; page: number; limit: number }> {
        const query: any = { userId: new Types.ObjectId(userId) };

        if (filters?.period) {
            query.period = filters.period;
        }

        if (filters?.categoryId) {
            query.categoryId = new Types.ObjectId(filters.categoryId);
        }

        if (filters?.categoryType) {
            query.categoryType = filters.categoryType;
        }

        if (filters?.startDate || filters?.endDate) {
            query.startDate = {};
            if (filters.startDate) {
                query.startDate.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                query.startDate.$lte = new Date(filters.endDate);
            }
        }

        if (filters?.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
            ];
        }

        const sort: any = {};
        if (sortOptions?.field) {
            sort[sortOptions.field] = sortOptions.order === 'asc' ? 1 : -1;
        } else {
            sort.createdAt = -1;
        }

        const skip = (page - 1) * limit;

        const [budgets, total] = await Promise.all([
            this.budgetModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
            this.budgetModel.countDocuments(query).exec(),
        ]);

        return { budgets, total, page, limit };
    }

    async findOne(userId: string, budgetId: string): Promise<BudgetDocument> {
        const budget = await this.budgetModel.findOne({
            _id: new Types.ObjectId(budgetId),
            userId: new Types.ObjectId(userId),
        }).exec();

        if (!budget) {
            throw new NotFoundException('Budget not found');
        }

        return budget;
    }

    async update(userId: string, budgetId: string, updateBudgetDto: UpdateBudgetDto): Promise<BudgetDocument> {
        const budget = await this.findOne(userId, budgetId);

        // Validate dates if provided
        if (updateBudgetDto.startDate) {
            const startDate = new Date(updateBudgetDto.startDate);
            if (isNaN(startDate.getTime())) {
                throw new BadRequestException('Invalid start date format');
            }
            if (updateBudgetDto.endDate) {
                const endDate = new Date(updateBudgetDto.endDate);
                if (endDate <= startDate) {
                    throw new BadRequestException('End date must be after start date');
                }
            } else if (budget.endDate && new Date(budget.endDate) <= startDate) {
                throw new BadRequestException('End date must be after start date');
            }
        }

        // Validate category if provided
        if (updateBudgetDto.categoryId && updateBudgetDto.categoryType) {
            await this.validateCategory(userId, updateBudgetDto.categoryId, updateBudgetDto.categoryType);
        }

        // Validate alert thresholds
        if (updateBudgetDto.alertThresholds) {
            const { warning, critical, exceeded } = updateBudgetDto.alertThresholds;
            if (warning !== undefined && (warning < 0 || warning > 100)) {
                throw new BadRequestException('Warning threshold must be between 0 and 100');
            }
            if (critical !== undefined && (critical < 0 || critical > 100)) {
                throw new BadRequestException('Critical threshold must be between 0 and 100');
            }
            if (exceeded !== undefined && (exceeded < 0 || exceeded > 100)) {
                throw new BadRequestException('Exceeded threshold must be between 0 and 100');
            }
        }

        Object.assign(budget, {
            ...updateBudgetDto,
            startDate: updateBudgetDto.startDate ? new Date(updateBudgetDto.startDate) : budget.startDate,
            endDate: updateBudgetDto.endDate !== undefined ? (updateBudgetDto.endDate ? new Date(updateBudgetDto.endDate) : null) : budget.endDate,
            categoryId: updateBudgetDto.categoryId ? new Types.ObjectId(updateBudgetDto.categoryId) : budget.categoryId,
        });

        return budget.save();
    }

    async remove(userId: string, budgetId: string): Promise<void> {
        const budget = await this.findOne(userId, budgetId);
        // Soft delete
        (budget as any).deletedAt = new Date();
        await budget.save();
    }

    async bulkDelete(userId: string, budgetIds: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        return bulkSoftDelete(this.budgetModel, userId, budgetIds);
    }

    /**
     * Calculate budget vs actual spending/income
     */
    async calculateBudgetStats(userId: string, budgetId: string): Promise<BudgetStats> {
        const budget = await this.findOne(userId, budgetId);

        // Determine the current period based on budget period
        const now = new Date();
        let periodStart: Date;
        let periodEnd: Date;

        if (budget.period === BudgetPeriod.MONTHLY) {
            periodStart = startOfMonth(now);
            periodEnd = endOfMonth(now);
        } else {
            periodStart = startOfYear(now);
            periodEnd = endOfYear(now);
        }

        // If budget has specific start/end dates, use those if they're more restrictive
        if (budget.startDate && budget.startDate > periodStart) {
            periodStart = budget.startDate;
        }
        if (budget.endDate && budget.endDate < periodEnd) {
            periodEnd = budget.endDate;
        }

        // Build transaction query
        const transactionQuery: any = {
            userId: new Types.ObjectId(userId),
            date: { $gte: periodStart, $lte: periodEnd },
        };

        // If budget is category-based, filter by category
        if (budget.categoryId && budget.categoryType) {
            transactionQuery.categoryId = new Types.ObjectId(budget.categoryId);

            // Determine transaction type based on category type
            if (budget.categoryType === 'ExpenseCategory') {
                transactionQuery.type = TransactionType.EXPENSE;
            } else {
                transactionQuery.type = TransactionType.INCOME;
            }
        }

        // Calculate actual amount
        const transactions = await this.transactionModel.find(transactionQuery).exec();
        const actualAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Calculate stats
        const remainingAmount = budget.amount - actualAmount;
        const percentageUsed = budget.amount > 0 ? (actualAmount / budget.amount) * 100 : 0;

        // Determine alert level
        const thresholds = budget.alertThresholds || { warning: 50, critical: 80, exceeded: 100 };
        let alertLevel: 'none' | 'warning' | 'critical' | 'exceeded' = 'none';

        if (percentageUsed >= thresholds.exceeded) {
            alertLevel = 'exceeded';
        } else if (percentageUsed >= thresholds.critical) {
            alertLevel = 'critical';
        } else if (percentageUsed >= thresholds.warning) {
            alertLevel = 'warning';
        }

        return {
            budgetId: budget._id.toString(),
            budgetAmount: budget.amount,
            actualAmount,
            remainingAmount,
            percentageUsed,
            alertLevel,
            periodStart,
            periodEnd,
        };
    }

    /**
     * Get all budgets with their stats
     */
    async findAllWithStats(userId: string, filters?: BudgetFilters): Promise<Array<BudgetDocument & { stats: BudgetStats }>> {
        const { budgets } = await this.findAll(userId, 1, 1000, filters);

        const budgetsWithStats = await Promise.all(
            budgets.map(async (budget) => {
                const stats = await this.calculateBudgetStats(userId, budget._id.toString());
                return { ...budget.toObject(), stats };
            }),
        );

        return budgetsWithStats as Array<BudgetDocument & { stats: BudgetStats }>;
    }

    /**
     * Check budgets for alerts
     */
    async checkBudgetAlerts(userId: string): Promise<Array<{ budget: BudgetDocument; stats: BudgetStats }>> {
        const { budgets } = await this.findAll(userId, 1, 1000);

        const alerts: Array<{ budget: BudgetDocument; stats: BudgetStats }> = [];

        for (const budget of budgets) {
            const stats = await this.calculateBudgetStats(userId, budget._id.toString());
            if (stats.alertLevel !== 'none') {
                alerts.push({ budget, stats });
            }
        }

        return alerts;
    }

    /**
     * Process budget rollover for a budget
     * If rolloverEnabled is true and there's remaining budget, create a new budget for the next period
     */
    async processBudgetRollover(userId: string, budgetId: string): Promise<BudgetDocument | null> {
        const budget = await this.findOne(userId, budgetId);

        if (!budget.rolloverEnabled) {
            return null;
        }

        const stats = await this.calculateBudgetStats(userId, budgetId);
        const remainingAmount = stats.remainingAmount;

        // Only rollover if there's remaining budget
        if (remainingAmount <= 0) {
            return null;
        }

        // Calculate next period dates
        const now = new Date();
        let nextPeriodStart: Date;
        let nextPeriodEnd: Date;

        if (budget.period === BudgetPeriod.MONTHLY) {
            // Next month
            nextPeriodStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1));
            nextPeriodEnd = endOfMonth(nextPeriodStart);
        } else {
            // Next year
            nextPeriodStart = startOfYear(new Date(now.getFullYear() + 1, 0, 1));
            nextPeriodEnd = endOfYear(nextPeriodStart);
        }

        // If budget has endDate and we've passed it, don't rollover
        if (budget.endDate && budget.endDate < now) {
            return null;
        }

        // Create new budget for next period with rolled over amount
        const rolledOverBudget = new this.budgetModel({
            userId: budget.userId,
            name: budget.name,
            categoryId: budget.categoryId,
            categoryType: budget.categoryType,
            amount: budget.amount + remainingAmount, // Original amount + remaining
            period: budget.period,
            startDate: nextPeriodStart,
            endDate: budget.endDate ? (budget.endDate > nextPeriodEnd ? nextPeriodEnd : budget.endDate) : undefined,
            alertThresholds: budget.alertThresholds,
            rolloverEnabled: budget.rolloverEnabled,
            description: budget.description,
        });

        return rolledOverBudget.save();
    }

    /**
     * Process rollover for all budgets that have rollover enabled
     * This should be called by a cron job at the end of each period
     */
    async processAllBudgetRollovers(userId: string): Promise<{ processedCount: number; rolledOverCount: number }> {
        const { budgets } = await this.findAll(userId, 1, 1000, {
            // Filter budgets that have rollover enabled and are ending soon
        });

        let processedCount = 0;
        let rolledOverCount = 0;

        for (const budget of budgets) {
            if (!budget.rolloverEnabled) {
                continue;
            }

            processedCount++;
            const rolledOver = await this.processBudgetRollover(userId, budget._id.toString());
            if (rolledOver) {
                rolledOverCount++;
            }
        }

        return { processedCount, rolledOverCount };
    }

    /**
     * Validate category exists and belongs to user
     */
    private async validateCategory(
        userId: string,
        categoryId: string,
        categoryType: 'ExpenseCategory' | 'IncomeCategory',
    ): Promise<void> {
        const Model = categoryType === 'ExpenseCategory' ? this.expenseCategoryModel : this.incomeCategoryModel;
        const category = await Model.findOne({
            _id: new Types.ObjectId(categoryId),
            userId: new Types.ObjectId(userId),
        }).exec();

        if (!category) {
            throw new NotFoundException(`${categoryType} not found`);
        }
    }
}

