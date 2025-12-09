import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionType } from '../../schemas/finance-transaction.schema';
import { FinanceAnalyticsBaseService } from './finance-analytics-base.service';

@Injectable()
export class FinanceAnalyticsForecastService extends FinanceAnalyticsBaseService {
    /**
     * Get forecast data
     */
    async getForecast(
        userId: string,
        period: '1month' | '3months' | '6months' | '1year' = '3months',
        startDate?: string,
        endDate?: string,
        currency?: string,
    ): Promise<{
        period: '1month' | '3months' | '6months' | '1year';
        forecast: Array<{
            period: string;
            projectedIncome: number;
            projectedExpenses: number;
            projectedNet: number;
            confidenceInterval: {
                income: { lower: number; upper: number };
                expenses: { lower: number; upper: number };
                net: { lower: number; upper: number };
            };
        }>;
        historicalAverage: {
            income: number;
            expenses: number;
            net: number;
        };
    }> {
        // Determine historical period based on forecast period
        let historicalMonths: number;
        switch (period) {
            case '1month':
                historicalMonths = 3; // Use last 3 months for 1 month forecast
                break;
            case '3months':
                historicalMonths = 6; // Use last 6 months for 3 month forecast
                break;
            case '6months':
                historicalMonths = 12; // Use last 12 months for 6 month forecast
                break;
            case '1year':
                historicalMonths = 24; // Use last 24 months for 1 year forecast
                break;
        }

        const now = new Date();
        const historicalStart = new Date(now.getFullYear(), now.getMonth() - historicalMonths, 1);
        const historicalEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const query: any = {
            userId: new Types.ObjectId(userId),
            date: { $gte: historicalStart, $lte: historicalEnd },
            ...this.buildCurrencyQuery(currency),
        };

        if (startDate) {
            query.date.$gte = new Date(startDate);
        }
        if (endDate) {
            query.date.$lte = new Date(endDate);
        }

        // Use baseAmount for multi-currency support
        const amountField = this.getAmountField();

        // Get historical monthly data
        const historicalAgg = await this.transactionModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        month: { $dateToString: { format: '%Y-%m', date: '$date' } },
                        type: '$type',
                    },
                    total: { $sum: amountField },
                },
            },
            { $sort: { '_id.month': 1 } },
        ]).exec();

        // Process historical data
        const monthlyData = new Map<string, { income: number; expenses: number }>();
        historicalAgg.forEach((item) => {
            const month = item._id.month;
            const existing = monthlyData.get(month) || { income: 0, expenses: 0 };
            if (item._id.type === TransactionType.INCOME) {
                existing.income = item.total;
            } else {
                existing.expenses = item.total;
            }
            monthlyData.set(month, existing);
        });

        const monthlyValues = Array.from(monthlyData.values());
        const incomeValues = monthlyValues.map((v) => v.income);
        const expenseValues = monthlyValues.map((v) => v.expenses);
        const netValues = monthlyValues.map((v) => v.income - v.expenses);

        // Calculate averages (simple moving average)
        const avgIncome = incomeValues.length > 0 ? incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length : 0;
        const avgExpenses = expenseValues.length > 0 ? expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length : 0;
        const avgNet = avgIncome - avgExpenses;

        // Calculate standard deviation for confidence intervals
        const calculateStdDev = (values: number[]): number => {
            if (values.length === 0) return 0;
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            return Math.sqrt(variance);
        };

        const incomeStdDev = calculateStdDev(incomeValues);
        const expensesStdDev = calculateStdDev(expenseValues);
        const netStdDev = calculateStdDev(netValues);

        // Confidence interval multiplier (95% confidence = 1.96)
        const confidenceMultiplier = 1.96;

        // Determine forecast periods
        let forecastPeriods: number;
        switch (period) {
            case '1month':
                forecastPeriods = 1;
                break;
            case '3months':
                forecastPeriods = 3;
                break;
            case '6months':
                forecastPeriods = 6;
                break;
            case '1year':
                forecastPeriods = 12;
                break;
        }

        // Generate forecast
        const forecast: Array<{
            period: string;
            projectedIncome: number;
            projectedExpenses: number;
            projectedNet: number;
            confidenceInterval: {
                income: { lower: number; upper: number };
                expenses: { lower: number; upper: number };
                net: { lower: number; upper: number };
            };
        }> = [];

        for (let i = 0; i < forecastPeriods; i++) {
            const forecastDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
            const periodStr = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;

            forecast.push({
                period: periodStr,
                projectedIncome: Math.max(0, avgIncome),
                projectedExpenses: Math.max(0, avgExpenses),
                projectedNet: avgNet,
                confidenceInterval: {
                    income: {
                        lower: Math.max(0, avgIncome - confidenceMultiplier * incomeStdDev),
                        upper: avgIncome + confidenceMultiplier * incomeStdDev,
                    },
                    expenses: {
                        lower: Math.max(0, avgExpenses - confidenceMultiplier * expensesStdDev),
                        upper: avgExpenses + confidenceMultiplier * expensesStdDev,
                    },
                    net: {
                        lower: avgNet - confidenceMultiplier * netStdDev,
                        upper: avgNet + confidenceMultiplier * netStdDev,
                    },
                },
            });
        }

        return {
            period,
            forecast,
            historicalAverage: {
                income: avgIncome,
                expenses: avgExpenses,
                net: avgNet,
            },
        };
    }
}

