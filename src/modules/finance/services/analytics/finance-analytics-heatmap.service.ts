import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionType } from '../../schemas/finance-transaction.schema';
import { FinanceAnalyticsBaseService } from './finance-analytics-base.service';

@Injectable()
export class FinanceAnalyticsHeatmapService extends FinanceAnalyticsBaseService {
    /**
     * Get heatmap calendar data
     */
    async getHeatmapData(
        userId: string,
        startDate?: string,
        endDate?: string,
        currency?: string,
    ): Promise<{
        data: Array<{
            date: string; // YYYY-MM-DD
            income: number;
            expenses: number;
            net: number;
            transactionCount: number;
        }>;
    }> {
        const query: any = { 
            userId: new Types.ObjectId(userId),
            ...this.buildCurrencyQuery(currency),
        };

        // Default to last 12 months if no date range provided
        if (!startDate || !endDate) {
            const now = new Date();
            const defaultStart = new Date(now.getFullYear(), now.getMonth() - 12, 1);
            query.date = {
                $gte: defaultStart,
                $lte: now,
            };
        } else {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // Use baseAmount for multi-currency support
        const amountField = this.getAmountField();

        // Aggregate by date
        const heatmapAgg = await this.transactionModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        type: '$type',
                    },
                    total: { $sum: amountField },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.date': 1 } },
        ]).exec();

        // Process aggregation results
        const dateMap = new Map<string, { income: number; expenses: number; incomeCount: number; expenseCount: number }>();

        heatmapAgg.forEach((item) => {
            const date = item._id.date;
            const existing = dateMap.get(date) || { income: 0, expenses: 0, incomeCount: 0, expenseCount: 0 };
            if (item._id.type === TransactionType.INCOME) {
                existing.income = item.total;
                existing.incomeCount = item.count;
            } else {
                existing.expenses = item.total;
                existing.expenseCount = item.count;
            }
            dateMap.set(date, existing);
        });

        // Convert to array format
        const data = Array.from(dateMap.entries())
            .map(([date, values]) => ({
                date,
                income: values.income,
                expenses: values.expenses,
                net: values.income - values.expenses,
                transactionCount: values.incomeCount + values.expenseCount,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return { data };
    }
}

