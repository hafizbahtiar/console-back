import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { TransactionType } from '../../schemas/finance-transaction.schema';

@Exclude()
export class TransactionTemplateResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    name: string;

    @Expose()
    amount: number;

    @Expose()
    description: string;

    @Expose()
    type: TransactionType;

    @Expose()
    @Transform(({ obj }) => obj.categoryId?.toString() || obj.categoryId || null)
    categoryId?: string;

    @Expose()
    notes?: string;

    @Expose()
    tags: string[];

    @Expose()
    paymentMethod?: string;

    @Expose()
    reference?: string;

    @Expose()
    category?: string;

    @Expose()
    usageCount: number;

    @Expose()
    lastUsedAt?: Date;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

