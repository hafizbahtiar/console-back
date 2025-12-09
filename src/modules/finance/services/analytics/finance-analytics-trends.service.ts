import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from '../../schemas/finance-transaction.schema';
import { FinanceAnalyticsBaseService } from './finance-analytics-base.service';

@Injectable()
export class FinanceAnalyticsTrendsService extends FinanceAnalyticsBaseService {
    /**
     * Get trends (monthly or yearly)
     */
    async getTrends(
        userId: string,
        period: 'monthly' | 'yearly',
        startDate?: string,
        endDate?: string,
        currency?: string,
    ): Promise<{
        period: 'monthly' | 'yearly';
        data: Array<{ period: string; income: number; expenses: number; net: number; transactionCount: number }>;
    }> {
        const query: any = { 
            userId: new Types.ObjectId(userId), 
            ...this.buildDateQuery(startDate, endDate),
            ...this.buildCurrencyQuery(currency),
        };

        let groupFormat: any;
        if (period === 'monthly') {
            groupFormat = {
                $dateToString: { format: '%Y-%m', date: '$date' },
            };
        } else {
            groupFormat = {
                $dateToString: { format: '%Y', date: '$date' },
            };
        }

        // Use baseAmount for multi-currency support
        const amountField = this.getAmountField();

        // Aggregate income by period
        const incomeAgg = await this.transactionModel.aggregate([
            { $match: { ...query, type: TransactionType.INCOME } },
            {
                $group: {
                    _id: groupFormat,
                    total: { $sum: amountField },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]).exec();

        // Aggregate expenses by period
        const expenseAgg = await this.transactionModel.aggregate([
            { $match: { ...query, type: TransactionType.EXPENSE } },
            {
                $group: {
                    _id: groupFormat,
                    total: { $sum: amountField },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]).exec();

        // Combine income and expenses by period
        const periodMap = new Map<string, { income: number; expenses: number; incomeCount: number; expenseCount: number }>();

        incomeAgg.forEach((item) => {
            periodMap.set(item._id, {
                income: item.total,
                expenses: 0,
                incomeCount: item.count,
                expenseCount: 0,
            });
        });

        expenseAgg.forEach((item) => {
            const existing = periodMap.get(item._id) || {
                income: 0,
                expenses: 0,
                incomeCount: 0,
                expenseCount: 0,
            };
            existing.expenses = item.total;
            existing.expenseCount = item.count;
            periodMap.set(item._id, existing);
        });

        // Convert to array format
        const data = Array.from(periodMap.entries())
            .map(([period, values]) => ({
                period,
                income: values.income,
                expenses: values.expenses,
                net: values.income - values.expenses,
                transactionCount: values.incomeCount + values.expenseCount,
            }))
            .sort((a, b) => a.period.localeCompare(b.period));

        return {
            period,
            data,
        };
    }

    /**
     * Get category trends over time
     */
    async getCategoryTrends(
        userId: string,
        categoryId?: string,
        startDate?: string,
        endDate?: string,
        aggregation: 'daily' | 'weekly' | 'monthly' = 'monthly',
        currency?: string,
    ): Promise<{
        categoryId?: string;
        categoryName?: string;
        aggregation: 'daily' | 'weekly' | 'monthly';
        data: Array<{ period: string; total: number; count: number }>;
    }> {
        const query: any = { 
            userId: new Types.ObjectId(userId), 
            ...this.buildDateQuery(startDate, endDate),
            ...this.buildCurrencyQuery(currency),
        };

        if (categoryId) {
            query.categoryId = new Types.ObjectId(categoryId);
        }

        // Get category name if categoryId provided
        let categoryName: string | undefined;
        if (categoryId) {
            const [expenseCat, incomeCat] = await Promise.all([
                this.expenseCategoryModel.findById(categoryId).exec(),
                this.incomeCategoryModel.findById(categoryId).exec(),
            ]);
            categoryName = expenseCat?.name || incomeCat?.name;
        }

        // Determine date format based on aggregation
        let dateFormat: string;
        switch (aggregation) {
            case 'daily':
                dateFormat = '%Y-%m-%d';
                break;
            case 'weekly':
                dateFormat = '%Y-W%V'; // ISO week format
                break;
            case 'monthly':
            default:
                dateFormat = '%Y-%m';
                break;
        }

        // Aggregate transactions by period
        const trendAgg = await this.transactionModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $dateToString: { format: dateFormat, date: '$date' },
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]).exec();

        return {
            categoryId,
            categoryName,
            aggregation,
            data: trendAgg.map((item) => ({
                period: item._id,
                total: item.total,
                count: item.count,
            })),
        };
    }
}

