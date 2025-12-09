import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TrendsResponseDto {
    @Expose()
    period: 'monthly' | 'yearly';

    @Expose()
    data: Array<{
        period: string; // e.g., "2024-01" for monthly, "2024" for yearly
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
    }>;
}

