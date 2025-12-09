import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MonthOverMonthComparisonResponseDto {
    @Expose()
    currentMonth: {
        period: string;
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
    };

    @Expose()
    previousMonth: {
        period: string;
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
    };

    @Expose()
    change: {
        income: { amount: number; percentage: number };
        expenses: { amount: number; percentage: number };
        net: { amount: number; percentage: number };
        transactionCount: { amount: number; percentage: number };
    };

    @Expose()
    categoryBreakdown?: Array<{
        categoryId?: string;
        categoryName?: string;
        current: number;
        previous: number;
        change: { amount: number; percentage: number };
    }>;
}

@Exclude()
export class YearOverYearComparisonResponseDto {
    @Expose()
    currentYear: {
        period: string;
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
        monthlyBreakdown: Array<{ month: string; income: number; expenses: number; net: number }>;
    };

    @Expose()
    previousYear: {
        period: string;
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
        monthlyBreakdown: Array<{ month: string; income: number; expenses: number; net: number }>;
    };

    @Expose()
    change: {
        income: { amount: number; percentage: number };
        expenses: { amount: number; percentage: number };
        net: { amount: number; percentage: number };
        transactionCount: { amount: number; percentage: number };
    };
}

