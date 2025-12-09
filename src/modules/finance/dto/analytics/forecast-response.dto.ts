import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ForecastResponseDto {
    @Expose()
    period: '1month' | '3months' | '6months' | '1year';

    @Expose()
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

    @Expose()
    historicalAverage: {
        income: number;
        expenses: number;
        net: number;
    };
}

