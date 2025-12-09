import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { TransactionType } from '../../schemas/finance-transaction.schema';
import { RecurringFrequency } from '../../schemas/finance-recurring-transaction.schema';

/**
 * Transaction Template Response DTO
 */
@Exclude()
export class TransactionTemplateResponseDto {
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
}

@Exclude()
export class RecurringTransactionResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    @Transform(({ obj }) => {
        // Transform embedded template object
        const template = obj.template || {};
        return {
            amount: template.amount,
            description: template.description,
            type: template.type,
            categoryId: template.categoryId?.toString() || template.categoryId || null,
            notes: template.notes,
            tags: template.tags || [],
            paymentMethod: template.paymentMethod,
            reference: template.reference,
        };
    })
    template: TransactionTemplateResponseDto;

    @Expose()
    frequency: RecurringFrequency;

    @Expose()
    interval: number;

    @Expose()
    startDate: Date;

    @Expose()
    endDate?: Date;

    @Expose()
    nextRunDate: Date;

    @Expose()
    isActive: boolean;

    @Expose()
    lastRunDate?: Date;

    @Expose()
    runCount: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

