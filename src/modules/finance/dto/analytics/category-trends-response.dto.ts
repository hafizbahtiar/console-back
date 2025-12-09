import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CategoryTrendsResponseDto {
    @Expose()
    categoryId?: string;

    @Expose()
    categoryName?: string;

    @Expose()
    aggregation: 'daily' | 'weekly' | 'monthly';

    @Expose()
    data: Array<{
        period: string;
        total: number;
        count: number;
    }>;
}

