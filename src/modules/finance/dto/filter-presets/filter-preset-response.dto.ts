import { Exclude, Expose } from 'class-transformer';
import { TransactionType } from '../../schemas/finance-transaction.schema';

@Exclude()
export class FilterPresetResponseDto {
    @Expose()
    id: string;

    @Expose()
    userId: string;

    @Expose()
    name: string;

    @Expose()
    filters: {
        type?: TransactionType;
        categoryId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        tags?: string[];
        paymentMethod?: string;
    };

    @Expose()
    description?: string;

    @Expose()
    isDefault: boolean;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

