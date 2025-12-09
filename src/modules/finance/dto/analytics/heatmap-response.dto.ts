import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class HeatmapResponseDto {
    @Expose()
    data: Array<{
        date: string; // YYYY-MM-DD
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
    }>;
}

