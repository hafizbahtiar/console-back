import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from '../../schemas/finance-transaction.schema';
import { ExpenseCategory, ExpenseCategoryDocument } from '../../schemas/finance-expense-category.schema';
import { IncomeCategory, IncomeCategoryDocument } from '../../schemas/finance-income-category.schema';
import { FinanceTransactionsService } from '../finance-transactions.service';
import { CurrencyPreferencesService } from '../../../settings/services/currency-preferences.service';
import { getDefaultCurrency } from '../../common/currency-codes';

/**
 * Base service for finance analytics services
 * Provides common dependencies and helper methods
 */
@Injectable()
export class FinanceAnalyticsBaseService {
    constructor(
        @InjectModel(Transaction.name) protected readonly transactionModel: Model<TransactionDocument>,
        @InjectModel(ExpenseCategory.name) protected readonly expenseCategoryModel: Model<ExpenseCategoryDocument>,
        @InjectModel(IncomeCategory.name) protected readonly incomeCategoryModel: Model<IncomeCategoryDocument>,
        protected readonly transactionsService: FinanceTransactionsService,
        protected readonly currencyPreferencesService: CurrencyPreferencesService,
    ) {}

    /**
     * Helper: Get top categories by type
     */
    protected async getTopCategoriesByType(
        userId: string,
        type: TransactionType,
        startDate?: string,
        endDate?: string,
        limit: number = 5,
        currency?: string,
    ): Promise<Array<{ categoryId?: string; categoryName?: string; total: number; count: number }>> {
        const query: any = { 
            userId: new Types.ObjectId(userId), 
            type,
            ...this.buildCurrencyQuery(currency),
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const categoryModel = type === TransactionType.EXPENSE
            ? this.expenseCategoryModel
            : this.incomeCategoryModel;

        // Get all categories
        const categories = await categoryModel.find({ userId: new Types.ObjectId(userId) }).exec();
        const categoryMap = new Map<string, string>();
        categories.forEach((cat) => {
            categoryMap.set(cat._id.toString(), cat.name);
        });

        // Aggregate by category (use baseAmount for multi-currency support)
        const amountField = this.getAmountField();
        const categoryAgg = await this.transactionModel.aggregate([
            { $match: { ...query, categoryId: { $ne: null } } },
            {
                $group: {
                    _id: '$categoryId',
                    total: { $sum: amountField },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
            { $limit: limit },
        ]).exec();

        return categoryAgg.map((item) => ({
            categoryId: item._id?.toString(),
            categoryName: categoryMap.get(item._id?.toString() || '') || 'Unknown',
            total: item.total,
            count: item.count,
        }));
    }

    /**
     * Helper: Build date query
     */
    protected buildDateQuery(startDate?: string, endDate?: string): any {
        const query: any = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }
        return query;
    }

    /**
     * Helper: Get user's base currency
     */
    protected async getUserBaseCurrency(userId: string): Promise<string> {
        try {
            const currencyPrefs = await this.currencyPreferencesService.getCurrencyPreferences(userId);
            return currencyPrefs.baseCurrency.toUpperCase();
        } catch (error) {
            return getDefaultCurrency();
        }
    }

    /**
     * Helper: Build currency query filter
     */
    protected buildCurrencyQuery(currency?: string): any {
        if (!currency) {
            return {};
        }
        return { currency: currency.toUpperCase() };
    }

    /**
     * Helper: Get amount field for aggregation (use baseAmount if available, fallback to amount)
     * This ensures all analytics use base currency for consistent reporting
     */
    protected getAmountField(): any {
        // Use $ifNull to fallback to amount if baseAmount is not set (for backward compatibility)
        return {
            $ifNull: ['$baseAmount', '$amount']
        };
    }

    /**
     * Helper: Get category map
     */
    protected async getCategoryMap(userId: string): Promise<Map<string, string>> {
        const [expenseCategories, incomeCategories] = await Promise.all([
            this.expenseCategoryModel.find({ userId: new Types.ObjectId(userId) }).exec(),
            this.incomeCategoryModel.find({ userId: new Types.ObjectId(userId) }).exec(),
        ]);

        const categoryMap = new Map<string, string>();
        expenseCategories.forEach((cat) => {
            categoryMap.set(cat._id.toString(), cat.name);
        });
        incomeCategories.forEach((cat) => {
            categoryMap.set(cat._id.toString(), cat.name);
        });

        return categoryMap;
    }
}

