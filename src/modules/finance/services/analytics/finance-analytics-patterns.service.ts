import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionType } from '../../schemas/finance-transaction.schema';
import { FinanceAnalyticsBaseService } from './finance-analytics-base.service';

@Injectable()
export class FinanceAnalyticsPatternsService extends FinanceAnalyticsBaseService {
    /**
     * Get spending patterns
     */
    async getSpendingPatterns(
        userId: string,
        startDate?: string,
        endDate?: string,
        currency?: string,
    ): Promise<{
        patterns: {
            daily: {
                dayOfWeek: number; // 0 = Sunday, 6 = Saturday
                averageAmount: number;
                transactionCount: number;
            }[];
            weekly: {
                weekOfMonth: number; // 1-4
                averageAmount: number;
                transactionCount: number;
            }[];
            monthly: {
                dayOfMonth: number; // 1-31
                averageAmount: number;
                transactionCount: number;
            }[];
        };
        anomalies: Array<{
            date: string;
            type: 'income' | 'expense';
            amount: number;
            deviation: number; // Standard deviations from mean
            description: string;
        }>;
    }> {
        const query: any = { userId: new Types.ObjectId(userId) };

        // Default to last 6 months if no date range provided
        if (!startDate || !endDate) {
            const now = new Date();
            const defaultStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
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

        // Get all transactions
        const transactions = await this.transactionModel.find(query).exec();

        // Daily patterns (by day of week)
        const dailyMap = new Map<number, { total: number; count: number }>();
        transactions.forEach((t) => {
            const dayOfWeek = new Date(t.date).getDay();
            const existing = dailyMap.get(dayOfWeek) || { total: 0, count: 0 };
            existing.total += t.amount;
            existing.count += 1;
            dailyMap.set(dayOfWeek, existing);
        });

        const daily = Array.from(dailyMap.entries())
            .map(([dayOfWeek, data]) => ({
                dayOfWeek,
                averageAmount: data.count > 0 ? data.total / data.count : 0,
                transactionCount: data.count,
            }))
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

        // Weekly patterns (by week of month)
        const weeklyMap = new Map<number, { total: number; count: number }>();
        transactions.forEach((t) => {
            const date = new Date(t.date);
            const weekOfMonth = Math.ceil(date.getDate() / 7);
            const existing = weeklyMap.get(weekOfMonth) || { total: 0, count: 0 };
            existing.total += t.amount;
            existing.count += 1;
            weeklyMap.set(weekOfMonth, existing);
        });

        const weekly = Array.from(weeklyMap.entries())
            .map(([weekOfMonth, data]) => ({
                weekOfMonth,
                averageAmount: data.count > 0 ? data.total / data.count : 0,
                transactionCount: data.count,
            }))
            .sort((a, b) => a.weekOfMonth - b.weekOfMonth);

        // Monthly patterns (by day of month)
        const monthlyMap = new Map<number, { total: number; count: number }>();
        transactions.forEach((t) => {
            const dayOfMonth = new Date(t.date).getDate();
            const existing = monthlyMap.get(dayOfMonth) || { total: 0, count: 0 };
            existing.total += t.amount;
            existing.count += 1;
            monthlyMap.set(dayOfMonth, existing);
        });

        const monthly = Array.from(monthlyMap.entries())
            .map(([dayOfMonth, data]) => ({
                dayOfMonth,
                averageAmount: data.count > 0 ? data.total / data.count : 0,
                transactionCount: data.count,
            }))
            .sort((a, b) => a.dayOfMonth - b.dayOfMonth);

        // Anomaly detection (transactions that are > 2 standard deviations from mean)
        const expenseTransactions = transactions.filter((t) => t.type === TransactionType.EXPENSE);
        const incomeTransactions = transactions.filter((t) => t.type === TransactionType.INCOME);

        const calculateAnomalies = (
            trans: typeof transactions,
            type: 'income' | 'expense',
        ): Array<{
            date: string;
            type: 'income' | 'expense';
            amount: number;
            deviation: number;
            description: string;
        }> => {
            if (trans.length === 0) return [];

            const amounts = trans.map((t) => t.amount);
            const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
            const stdDev = Math.sqrt(variance);

            const anomalies: Array<{
                date: string;
                type: 'income' | 'expense';
                amount: number;
                deviation: number;
                description: string;
            }> = [];

            trans.forEach((t) => {
                const deviation = (t.amount - mean) / stdDev;
                if (Math.abs(deviation) > 2) {
                    anomalies.push({
                        date: new Date(t.date).toISOString().split('T')[0],
                        type,
                        amount: t.amount,
                        deviation,
                        description: `${type === 'expense' ? 'Unusually high' : 'Unusually high'} ${type} transaction`,
                    });
                }
            });

            return anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
        };

        const expenseAnomalies = calculateAnomalies(expenseTransactions, 'expense');
        const incomeAnomalies = calculateAnomalies(incomeTransactions, 'income');
        const anomalies = [...expenseAnomalies, ...incomeAnomalies].sort(
            (a, b) => Math.abs(b.deviation) - Math.abs(a.deviation),
        );

        return {
            patterns: {
                daily,
                weekly,
                monthly,
            },
            anomalies: anomalies.slice(0, 20), // Limit to top 20 anomalies
        };
    }
}

