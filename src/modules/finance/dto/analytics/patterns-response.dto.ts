import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SpendingPatternsResponseDto {
    @Expose()
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

    @Expose()
    anomalies: Array<{
        date: string;
        type: 'income' | 'expense';
        amount: number;
        deviation: number; // Standard deviations from mean
        description: string;
    }>;
}

