import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CalendarResponseDto {
    @Expose()
    data: Array<{
        date: string; // YYYY-MM-DD
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
    }>;

    @Expose()
    summary: {
        totalIncome: number;
        totalExpenses: number;
        totalNet: number;
        totalTransactions: number;
    };
}

