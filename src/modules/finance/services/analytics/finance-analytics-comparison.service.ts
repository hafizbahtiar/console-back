import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionType } from '../../schemas/finance-transaction.schema';
import { FinanceAnalyticsBaseService } from './finance-analytics-base.service';

@Injectable()
export class FinanceAnalyticsComparisonService extends FinanceAnalyticsBaseService {
    /**
     * Get month-over-month comparison
     */
    async getMonthOverMonthComparison(
        userId: string,
        categoryId?: string,
        currency?: string,
    ): Promise<{
        currentMonth: {
            period: string;
            income: number;
            expenses: number;
            net: number;
            transactionCount: number;
        };
        previousMonth: {
            period: string;
            income: number;
            expenses: number;
            net: number;
            transactionCount: number;
        };
        change: {
            income: { amount: number; percentage: number };
            expenses: { amount: number; percentage: number };
            net: { amount: number; percentage: number };
            transactionCount: { amount: number; percentage: number };
        };
        categoryBreakdown?: Array<{
            categoryId?: string;
            categoryName?: string;
            current: number;
            previous: number;
            change: { amount: number; percentage: number };
        }>;
    }> {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const baseQuery: any = { userId: new Types.ObjectId(userId) };
        if (categoryId) {
            baseQuery.categoryId = new Types.ObjectId(categoryId);
        }

        const currencyQuery = this.buildCurrencyQuery(currency);
        const amountField = this.getAmountField();

        const currentMonthQuery = {
            ...baseQuery,
            ...currencyQuery,
            date: { $gte: currentMonthStart, $lte: currentMonthEnd },
        };
        const previousMonthQuery = {
            ...baseQuery,
            ...currencyQuery,
            date: { $gte: previousMonthStart, $lte: previousMonthEnd },
        };

        // Get current month data
        const [currentIncome, currentExpenses, currentIncomeCount, currentExpenseCount] = await Promise.all([
            this.transactionModel.aggregate([
                { $match: { ...currentMonthQuery, type: TransactionType.INCOME } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.aggregate([
                { $match: { ...currentMonthQuery, type: TransactionType.EXPENSE } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.countDocuments({ ...currentMonthQuery, type: TransactionType.INCOME }).exec(),
            this.transactionModel.countDocuments({ ...currentMonthQuery, type: TransactionType.EXPENSE }).exec(),
        ]);

        // Get previous month data
        const [previousIncome, previousExpenses, previousIncomeCount, previousExpenseCount] = await Promise.all([
            this.transactionModel.aggregate([
                { $match: { ...previousMonthQuery, type: TransactionType.INCOME } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.aggregate([
                { $match: { ...previousMonthQuery, type: TransactionType.EXPENSE } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.countDocuments({ ...previousMonthQuery, type: TransactionType.INCOME }).exec(),
            this.transactionModel.countDocuments({ ...previousMonthQuery, type: TransactionType.EXPENSE }).exec(),
        ]);

        const currentIncomeTotal = currentIncome[0]?.total || 0;
        const currentExpensesTotal = currentExpenses[0]?.total || 0;
        const previousIncomeTotal = previousIncome[0]?.total || 0;
        const previousExpensesTotal = previousExpenses[0]?.total || 0;

        const currentMonth = {
            period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            income: currentIncomeTotal,
            expenses: currentExpensesTotal,
            net: currentIncomeTotal - currentExpensesTotal,
            transactionCount: currentIncomeCount + currentExpenseCount,
        };

        const previousMonthPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonth = {
            period: `${previousMonthPeriod.getFullYear()}-${String(previousMonthPeriod.getMonth() + 1).padStart(2, '0')}`,
            income: previousIncomeTotal,
            expenses: previousExpensesTotal,
            net: previousIncomeTotal - previousExpensesTotal,
            transactionCount: previousIncomeCount + previousExpenseCount,
        };

        // Calculate changes
        const incomeChange = currentIncomeTotal - previousIncomeTotal;
        const expensesChange = currentExpensesTotal - previousExpensesTotal;
        const netChange = currentMonth.net - previousMonth.net;
        const transactionCountChange = currentMonth.transactionCount - previousMonth.transactionCount;

        const change = {
            income: {
                amount: incomeChange,
                percentage: previousIncomeTotal > 0 ? (incomeChange / previousIncomeTotal) * 100 : 0,
            },
            expenses: {
                amount: expensesChange,
                percentage: previousExpensesTotal > 0 ? (expensesChange / previousExpensesTotal) * 100 : 0,
            },
            net: {
                amount: netChange,
                percentage: previousMonth.net !== 0 ? (netChange / Math.abs(previousMonth.net)) * 100 : 0,
            },
            transactionCount: {
                amount: transactionCountChange,
                percentage: previousMonth.transactionCount > 0 ? (transactionCountChange / previousMonth.transactionCount) * 100 : 0,
            },
        };

        // Get category breakdown if no specific category requested
        let categoryBreakdown: Array<{
            categoryId?: string;
            categoryName?: string;
            current: number;
            previous: number;
            change: { amount: number; percentage: number };
        }> | undefined;

        if (!categoryId) {
            const categoryMap = await this.getCategoryMap(userId);

            // Get current month category breakdown
            const currentCategoryAgg = await this.transactionModel.aggregate([
                { $match: { ...currentMonthQuery, categoryId: { $ne: null } } },
                {
                    $group: {
                        _id: '$categoryId',
                        total: { $sum: amountField },
                    },
                },
            ]).exec();

            // Get previous month category breakdown
            const previousCategoryAgg = await this.transactionModel.aggregate([
                { $match: { ...previousMonthQuery, categoryId: { $ne: null } } },
                {
                    $group: {
                        _id: '$categoryId',
                        total: { $sum: amountField },
                    },
                },
            ]).exec();

            const categoryMapCurrent = new Map<string, number>();
            currentCategoryAgg.forEach((item) => {
                categoryMapCurrent.set(item._id?.toString() || '', item.total);
            });

            const categoryMapPrevious = new Map<string, number>();
            previousCategoryAgg.forEach((item) => {
                categoryMapPrevious.set(item._id?.toString() || '', item.total);
            });

            // Combine all categories
            const allCategoryIds = new Set([
                ...Array.from(categoryMapCurrent.keys()),
                ...Array.from(categoryMapPrevious.keys()),
            ]);

            categoryBreakdown = Array.from(allCategoryIds).map((catId) => {
                const current = categoryMapCurrent.get(catId) || 0;
                const previous = categoryMapPrevious.get(catId) || 0;
                const changeAmount = current - previous;
                return {
                    categoryId: catId,
                    categoryName: categoryMap.get(catId) || 'Unknown',
                    current,
                    previous,
                    change: {
                        amount: changeAmount,
                        percentage: previous > 0 ? (changeAmount / previous) * 100 : 0,
                    },
                };
            }).sort((a, b) => Math.abs(b.change.amount) - Math.abs(a.change.amount));
        }

        return {
            currentMonth,
            previousMonth,
            change,
            categoryBreakdown,
        };
    }

    /**
     * Get year-over-year comparison
     */
    async getYearOverYearComparison(
        userId: string,
        categoryId?: string,
        currency?: string,
    ): Promise<{
        currentYear: {
            period: string;
            income: number;
            expenses: number;
            net: number;
            transactionCount: number;
            monthlyBreakdown: Array<{ month: string; income: number; expenses: number; net: number }>;
        };
        previousYear: {
            period: string;
            income: number;
            expenses: number;
            net: number;
            transactionCount: number;
            monthlyBreakdown: Array<{ month: string; income: number; expenses: number; net: number }>;
        };
        change: {
            income: { amount: number; percentage: number };
            expenses: { amount: number; percentage: number };
            net: { amount: number; percentage: number };
            transactionCount: { amount: number; percentage: number };
        };
    }> {
        const now = new Date();
        const currentYearStart = new Date(now.getFullYear(), 0, 1);
        const currentYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        const previousYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const previousYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

        const baseQuery: any = { userId: new Types.ObjectId(userId) };
        if (categoryId) {
            baseQuery.categoryId = new Types.ObjectId(categoryId);
        }

        const currencyQuery = this.buildCurrencyQuery(currency);
        const amountField = this.getAmountField();

        const currentYearQuery = {
            ...baseQuery,
            ...currencyQuery,
            date: { $gte: currentYearStart, $lte: currentYearEnd },
        };
        const previousYearQuery = {
            ...baseQuery,
            ...currencyQuery,
            date: { $gte: previousYearStart, $lte: previousYearEnd },
        };

        // Get current year totals
        const [currentIncome, currentExpenses, currentIncomeCount, currentExpenseCount] = await Promise.all([
            this.transactionModel.aggregate([
                { $match: { ...currentYearQuery, type: TransactionType.INCOME } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.aggregate([
                { $match: { ...currentYearQuery, type: TransactionType.EXPENSE } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.countDocuments({ ...currentYearQuery, type: TransactionType.INCOME }).exec(),
            this.transactionModel.countDocuments({ ...currentYearQuery, type: TransactionType.EXPENSE }).exec(),
        ]);

        // Get previous year totals
        const [previousIncome, previousExpenses, previousIncomeCount, previousExpenseCount] = await Promise.all([
            this.transactionModel.aggregate([
                { $match: { ...previousYearQuery, type: TransactionType.INCOME } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.aggregate([
                { $match: { ...previousYearQuery, type: TransactionType.EXPENSE } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.countDocuments({ ...previousYearQuery, type: TransactionType.INCOME }).exec(),
            this.transactionModel.countDocuments({ ...previousYearQuery, type: TransactionType.EXPENSE }).exec(),
        ]);

        const currentIncomeTotal = currentIncome[0]?.total || 0;
        const currentExpensesTotal = currentExpenses[0]?.total || 0;
        const previousIncomeTotal = previousIncome[0]?.total || 0;
        const previousExpensesTotal = previousExpenses[0]?.total || 0;

        // Get monthly breakdown for current year
        const currentMonthlyAgg = await this.transactionModel.aggregate([
            { $match: currentYearQuery },
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

        // Get monthly breakdown for previous year
        const previousMonthlyAgg = await this.transactionModel.aggregate([
            { $match: previousYearQuery },
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

        // Process monthly breakdown
        const currentMonthlyMap = new Map<string, { income: number; expenses: number }>();
        currentMonthlyAgg.forEach((item) => {
            const month = item._id.month;
            const existing = currentMonthlyMap.get(month) || { income: 0, expenses: 0 };
            if (item._id.type === TransactionType.INCOME) {
                existing.income = item.total;
            } else {
                existing.expenses = item.total;
            }
            currentMonthlyMap.set(month, existing);
        });

        const previousMonthlyMap = new Map<string, { income: number; expenses: number }>();
        previousMonthlyAgg.forEach((item) => {
            const month = item._id.month;
            const existing = previousMonthlyMap.get(month) || { income: 0, expenses: 0 };
            if (item._id.type === TransactionType.INCOME) {
                existing.income = item.total;
            } else {
                existing.expenses = item.total;
            }
            previousMonthlyMap.set(month, existing);
        });

        // Generate all months for both years
        const allMonths = new Set([
            ...Array.from(currentMonthlyMap.keys()),
            ...Array.from(previousMonthlyMap.keys()),
        ]);

        const currentMonthlyBreakdown = Array.from(allMonths)
            .filter((month) => month.startsWith(String(now.getFullYear())))
            .map((month) => {
                const data = currentMonthlyMap.get(month) || { income: 0, expenses: 0 };
                return {
                    month,
                    income: data.income,
                    expenses: data.expenses,
                    net: data.income - data.expenses,
                };
            })
            .sort((a, b) => a.month.localeCompare(b.month));

        const previousMonthlyBreakdown = Array.from(allMonths)
            .filter((month) => month.startsWith(String(now.getFullYear() - 1)))
            .map((month) => {
                const data = previousMonthlyMap.get(month) || { income: 0, expenses: 0 };
                return {
                    month,
                    income: data.income,
                    expenses: data.expenses,
                    net: data.income - data.expenses,
                };
            })
            .sort((a, b) => a.month.localeCompare(b.month));

        const currentYear = {
            period: String(now.getFullYear()),
            income: currentIncomeTotal,
            expenses: currentExpensesTotal,
            net: currentIncomeTotal - currentExpensesTotal,
            transactionCount: currentIncomeCount + currentExpenseCount,
            monthlyBreakdown: currentMonthlyBreakdown,
        };

        const previousYear = {
            period: String(now.getFullYear() - 1),
            income: previousIncomeTotal,
            expenses: previousExpensesTotal,
            net: previousIncomeTotal - previousExpensesTotal,
            transactionCount: previousIncomeCount + previousExpenseCount,
            monthlyBreakdown: previousMonthlyBreakdown,
        };

        // Calculate changes
        const incomeChange = currentIncomeTotal - previousIncomeTotal;
        const expensesChange = currentExpensesTotal - previousExpensesTotal;
        const netChange = currentYear.net - previousYear.net;
        const transactionCountChange = currentYear.transactionCount - previousYear.transactionCount;

        const change = {
            income: {
                amount: incomeChange,
                percentage: previousIncomeTotal > 0 ? (incomeChange / previousIncomeTotal) * 100 : 0,
            },
            expenses: {
                amount: expensesChange,
                percentage: previousExpensesTotal > 0 ? (expensesChange / previousExpensesTotal) * 100 : 0,
            },
            net: {
                amount: netChange,
                percentage: previousYear.net !== 0 ? (netChange / Math.abs(previousYear.net)) * 100 : 0,
            },
            transactionCount: {
                amount: transactionCountChange,
                percentage: previousYear.transactionCount > 0 ? (transactionCountChange / previousYear.transactionCount) * 100 : 0,
            },
        };

        return {
            currentYear,
            previousYear,
            change,
        };
    }
}

