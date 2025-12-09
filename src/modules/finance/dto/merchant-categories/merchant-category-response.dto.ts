import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MerchantCategoryResponseDto {
    @Expose()
    id: string;

    @Expose()
    merchantName: string;

    @Expose()
    categoryId: string;

    @Expose()
    categoryName: string;

    @Expose()
    matchCount: number;

    @Expose()
    confidence: number;

    @Expose()
    lastUsedAt: Date;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

