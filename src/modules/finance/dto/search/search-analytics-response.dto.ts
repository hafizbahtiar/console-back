import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SearchAnalyticsItemDto {
    @Expose()
    text: string;

    @Expose()
    count: number;
}

@Exclude()
export class SearchAnalyticsResponseDto {
    @Expose()
    popularDescriptions: SearchAnalyticsItemDto[];

    @Expose()
    popularTags: SearchAnalyticsItemDto[];

    @Expose()
    popularPaymentMethods: SearchAnalyticsItemDto[];
}

