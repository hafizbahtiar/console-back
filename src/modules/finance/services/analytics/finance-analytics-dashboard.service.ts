import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionType } from '../../schemas/finance-transaction.schema';
import { FinanceAnalyticsBaseService } from './finance-analytics-base.service';

@Injectable()
export class FinanceAnalyticsDashboardService extends FinanceAnalyticsBaseService {
    /**
     * Get dashboard data
     */
    async getDashboard(
        userId: string,
        startDate?: string,
        endDate?: string,
        limit: number = 5,
        currency?: string,
    ): Promise<{
        totalIncome: number;
        totalExpenses: number;
        netAmount: number;
        transactionCount: number;
        recentTransactions: any[];
        topExpenseCategories: Array<{ categoryId?: string; categoryName?: string; total: number; count: number }>;
        topIncomeCategories: Array<{ categoryId?: string; categoryName?: string; total: number; count: number }>;
    }> {
        const query: any = { 
            userId: new Types.ObjectId(userId), 
            ...this.buildDateQuery(startDate, endDate),
            ...this.buildCurrencyQuery(currency),
        };

        // Get statistics
        const statistics = await this.transactionsService.getStatistics(userId, startDate, endDate);

        // Get recent transactions
        const recentTransactions = await this.transactionModel
            .find(query)
            .sort({ date: -1, createdAt: -1 })
            .limit(limit)
            .exec();

        // Get top expense categories
        const topExpenseCategories = await this.getTopCategoriesByType(
            userId,
            TransactionType.EXPENSE,
            startDate,
            endDate,
            limit,
        );

        // Get top income categories
        const topIncomeCategories = await this.getTopCategoriesByType(
            userId,
            TransactionType.INCOME,
            startDate,
            endDate,
            limit,
        );

        return {
            ...statistics,
            recentTransactions: recentTransactions.map((t) => t.toObject()),
            topExpenseCategories,
            topIncomeCategories,
        };
    }

    /**
     * Get income vs expenses comparison
     */
    async getIncomeVsExpenses(
        userId: string,
        startDate?: string,
        endDate?: string,
        currency?: string,
    ): Promise<{
        totalIncome: number;
        totalExpenses: number;
        netAmount: number;
        incomeCount: number;
        expenseCount: number;
        period: { startDate?: string; endDate?: string };
    }> {
        const query: any = { 
            userId: new Types.ObjectId(userId), 
            ...this.buildDateQuery(startDate, endDate),
            ...this.buildCurrencyQuery(currency),
        };
        const amountField = this.getAmountField();

        const [incomeResult, expenseResult, incomeCount, expenseCount] = await Promise.all([
            this.transactionModel.aggregate([
                { $match: { ...query, type: TransactionType.INCOME } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.aggregate([
                { $match: { ...query, type: TransactionType.EXPENSE } },
                { $group: { _id: null, total: { $sum: amountField } } },
            ]).exec(),
            this.transactionModel.countDocuments({ ...query, type: TransactionType.INCOME }).exec(),
            this.transactionModel.countDocuments({ ...query, type: TransactionType.EXPENSE }).exec(),
        ]);

        const totalIncome = incomeResult[0]?.total || 0;
        const totalExpenses = expenseResult[0]?.total || 0;
        const netAmount = totalIncome - totalExpenses;

        return {
            totalIncome,
            totalExpenses,
            netAmount,
            incomeCount,
            expenseCount,
            period: { startDate, endDate },
        };
    }

    /**
     * Get category breakdown
     */
    async getCategoryBreakdown(
        userId: string,
        startDate?: string,
        endDate?: string,
        currency?: string,
    ): Promise<{
        expenseCategories: Array<{ categoryId?: string; categoryName?: string; total: number; count: number; percentage: number }>;
        incomeCategories: Array<{ categoryId?: string; categoryName?: string; total: number; count: number; percentage: number }>;
        uncategorized: {
            expenses: { total: number; count: number };
            income: { total: number; count: number };
        };
    }> {
        const query: any = { 
            userId: new Types.ObjectId(userId), 
            ...this.buildDateQuery(startDate, endDate),
            ...this.buildCurrencyQuery(currency),
        };
        const amountField = this.getAmountField();

        // Get all categories
        const categoryMap = await this.getCategoryMap(userId);

        // Aggregate by category for expenses
        const expenseCategoryAgg = await this.transactionModel.aggregate([
            { $match: { ...query, type: TransactionType.EXPENSE, categoryId: { $ne: null } } },
            {
                $group: {
                    _id: '$categoryId',
                    total: { $sum: amountField },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
        ]).exec();

        // Aggregate by category for income
        const incomeCategoryAgg = await this.transactionModel.aggregate([
            { $match: { ...query, type: TransactionType.INCOME, categoryId: { $ne: null } } },
            {
                $group: {
                    _id: '$categoryId',
                    total: { $sum: amountField },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
        ]).exec();

        // Get uncategorized totals
        const [uncategorizedExpenses, uncategorizedIncome] = await Promise.all([
            this.transactionModel.aggregate([
                { $match: { ...query, type: TransactionType.EXPENSE, categoryId: null } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: amountField },
                        count: { $sum: 1 },
                    },
                },
            ]).exec(),
            this.transactionModel.aggregate([
                { $match: { ...query, type: TransactionType.INCOME, categoryId: null } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: amountField },
                        count: { $sum: 1 },
                    },
                },
            ]).exec(),
        ]);

        // Calculate total expenses and income for percentage calculation
        const totalExpenses = expenseCategoryAgg.reduce((sum, item) => sum + item.total, 0) +
            (uncategorizedExpenses[0]?.total || 0);
        const totalIncome = incomeCategoryAgg.reduce((sum, item) => sum + item.total, 0) +
            (uncategorizedIncome[0]?.total || 0);

        // Format expense categories with percentages
        const formattedExpenseCategories = expenseCategoryAgg.map((item) => {
            return {
                categoryId: item._id?.toString(),
                categoryName: categoryMap.get(item._id?.toString() || '') || 'Unknown',
                total: item.total,
                count: item.count,
                percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0,
            };
        });

        // Format income categories with percentages
        const formattedIncomeCategories = incomeCategoryAgg.map((item) => {
            return {
                categoryId: item._id?.toString(),
                categoryName: categoryMap.get(item._id?.toString() || '') || 'Unknown',
                total: item.total,
                count: item.count,
                percentage: totalIncome > 0 ? (item.total / totalIncome) * 100 : 0,
            };
        });

        return {
            expenseCategories: formattedExpenseCategories,
            incomeCategories: formattedIncomeCategories,
            uncategorized: {
                expenses: {
                    total: uncategorizedExpenses[0]?.total || 0,
                    count: uncategorizedExpenses[0]?.count || 0,
                },
                income: {
                    total: uncategorizedIncome[0]?.total || 0,
                    count: uncategorizedIncome[0]?.count || 0,
                },
            },
        };
    }

    /**
     * Export transactions to CSV
     */
    async exportTransactions(
        userId: string,
        startDate?: string,
        endDate?: string,
        type?: TransactionType,
        currency?: string,
    ): Promise<any[]> {
        const query: any = { 
            userId: new Types.ObjectId(userId), 
            ...this.buildDateQuery(startDate, endDate),
            ...this.buildCurrencyQuery(currency),
        };

        if (type) {
            query.type = type;
        }

        const transactions = await this.transactionModel
            .find(query)
            .sort({ date: -1, createdAt: -1 })
            .exec();

        // Get category names
        const categoryMap = await this.getCategoryMap(userId);

        // Format transactions for export
        return transactions.map((transaction) => {
            const obj = transaction.toObject();
            return {
                Date: obj.date ? new Date(obj.date).toISOString().split('T')[0] : '',
                Type: obj.type,
                Amount: obj.amount,
                Currency: obj.currency || 'MYR',
                'Base Amount': obj.baseAmount !== undefined && obj.baseAmount !== null ? obj.baseAmount : obj.amount,
                'Base Currency': obj.baseCurrency || 'MYR',
                'Exchange Rate': obj.exchangeRate !== undefined && obj.exchangeRate !== null ? obj.exchangeRate : 1.0,
                Description: obj.description || '',
                Category: obj.categoryId ? categoryMap.get(obj.categoryId.toString()) || 'Unknown' : 'Uncategorized',
                Notes: obj.notes || '',
                Tags: obj.tags?.join(', ') || '',
                'Payment Method': obj.paymentMethod || '',
                Reference: obj.reference || '',
            };
        });
    }
}

