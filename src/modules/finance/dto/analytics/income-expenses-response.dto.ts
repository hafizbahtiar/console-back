import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class IncomeExpensesResponseDto {
    @Expose()
    totalIncome: number;

    @Expose()
    totalExpenses: number;

    @Expose()
    netAmount: number;

    @Expose()
    incomeCount: number;

    @Expose()
    expenseCount: number;

    @Expose()
    period: {
        startDate?: string;
        endDate?: string;
    };
}

