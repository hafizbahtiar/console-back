import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { TransactionType } from '../../schemas/finance-transaction.schema';

@Exclude()
export class TransactionResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    amount: number;

    @Expose()
    currency: string;

    @Expose()
    exchangeRate?: number;

    @Expose()
    baseAmount?: number;

    @Expose()
    baseCurrency?: string;

    @Expose()
    date: Date;

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
    @Transform(({ obj }) => obj.recurringTransactionId?.toString() || obj.recurringTransactionId || null)
    recurringTransactionId?: string;

    @Expose()
    receiptUrl?: string;

    @Expose()
    receiptFilename?: string;

    @Expose()
    receiptMimetype?: string;

    @Expose()
    receiptSize?: number;

    @Expose()
    receiptUploadedAt?: Date;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

