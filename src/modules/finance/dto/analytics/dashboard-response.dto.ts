import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DashboardResponseDto {
    @Expose()
    totalIncome: number;

    @Expose()
    totalExpenses: number;

    @Expose()
    netAmount: number;

    @Expose()
    transactionCount: number;

    @Expose()
    recentTransactions: any[];

    @Expose()
    topExpenseCategories: Array<{
        categoryId?: string;
        categoryName?: string;
        total: number;
        count: number;
    }>;

    @Expose()
    topIncomeCategories: Array<{
        categoryId?: string;
        categoryName?: string;
        total: number;
        count: number;
    }>;
}

