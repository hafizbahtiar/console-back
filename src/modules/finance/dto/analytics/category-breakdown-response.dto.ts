import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CategoryBreakdownResponseDto {
    @Expose()
    expenseCategories: Array<{
        categoryId?: string;
        categoryName?: string;
        total: number;
        count: number;
        percentage: number;
    }>;

    @Expose()
    incomeCategories: Array<{
        categoryId?: string;
        categoryName?: string;
        total: number;
        count: number;
        percentage: number;
    }>;

    @Expose()
    uncategorized: {
        expenses: {
            total: number;
            count: number;
        };
        income: {
            total: number;
            count: number;
        };
    };
}

