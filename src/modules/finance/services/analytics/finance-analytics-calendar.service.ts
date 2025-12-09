import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionType } from '../../schemas/finance-transaction.schema';
import { FinanceAnalyticsBaseService } from './finance-analytics-base.service';

/**
 * Calendar Analytics Service
 * 
 * Optimized for calendar view with daily transaction aggregation.
 * Uses MongoDB aggregation pipeline for efficient date-based grouping.
 * 
 * Performance optimizations:
 * - Single aggregation pipeline for all daily totals
 * - Leverages existing indexes (userId + date)
 * - Efficient date range queries
 * - Optimized for single-month queries (most common use case)
 */
@Injectable()
export class FinanceAnalyticsCalendarService extends FinanceAnalyticsBaseService {
    /**
     * Get calendar data (daily transaction aggregation)
     * 
     * Optimized for calendar view with efficient MongoDB aggregation.
     * Returns daily totals for income, expenses, net, and transaction count.
     * 
     * @param userId - User ID
     * @param startDate - Start date (YYYY-MM-DD) - defaults to start of current month
     * @param endDate - End date (YYYY-MM-DD) - defaults to end of current month
     * @returns Daily transaction summaries
     */
    async getCalendarData(
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
        summary: {
            totalIncome: number;
            totalExpenses: number;
            totalNet: number;
            totalTransactions: number;
        };
    }> {
        const query: any = { 
            userId: new Types.ObjectId(userId),
            ...this.buildCurrencyQuery(currency),
        };

        // Default to current month if no date range provided
        if (!startDate || !endDate) {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            query.date = {
                $gte: monthStart,
                $lte: monthEnd,
            };
        } else {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // Use baseAmount for multi-currency support
        const amountField = this.getAmountField();

        // Single aggregation pipeline for optimal performance
        // This is more efficient than separate queries for income/expenses
        const calendarAgg = await this.transactionModel.aggregate([
            // Match transactions in date range
            { $match: query },
            // Group by date and type, calculate totals
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
            // Sort by date
            { $sort: { '_id.date': 1 } },
        ]).exec();

        // Process aggregation results into date map
        const dateMap = new Map<string, { income: number; expenses: number; incomeCount: number; expenseCount: number }>();

        calendarAgg.forEach((item) => {
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

        // Calculate totals for summary
        let totalIncome = 0;
        let totalExpenses = 0;
        let totalTransactions = 0;

        // Convert to array format and calculate summary
        const data = Array.from(dateMap.entries())
            .map(([date, values]) => {
                const net = values.income - values.expenses;
                const transactionCount = values.incomeCount + values.expenseCount;

                totalIncome += values.income;
                totalExpenses += values.expenses;
                totalTransactions += transactionCount;

                return {
                    date,
                    income: values.income,
                    expenses: values.expenses,
                    net,
                    transactionCount,
                };
            })
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            data,
            summary: {
                totalIncome,
                totalExpenses,
                totalNet: totalIncome - totalExpenses,
                totalTransactions,
            },
        };
    }

    /**
     * Get daily totals for a specific date range
     * 
     * Optimized endpoint for calendar view daily aggregation.
     * Returns income, expenses, and net per day.
     * 
     * @param userId - User ID
     * @param startDate - Start date (YYYY-MM-DD)
     * @param endDate - End date (YYYY-MM-DD)
     * @returns Daily totals
     */
    async getDailyTotals(
        userId: string,
        startDate: string,
        endDate: string,
    ): Promise<Array<{
        date: string; // YYYY-MM-DD
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
    }>> {
        const result = await this.getCalendarData(userId, startDate, endDate);
        return result.data;
    }
}

