import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';
import { TransactionType } from './finance-transaction.schema';

export type RecurringTransactionDocument = RecurringTransaction & Document;

export enum RecurringFrequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
    CUSTOM = 'custom',
}

/**
 * Transaction template - embedded object containing transaction data
 * This is used as a template when generating actual transactions
 */
@Schema({ _id: false })
export class TransactionTemplate {
    @Prop({ required: true, type: Number, min: 0 })
    amount: number;

    @Prop({ required: true, trim: true, maxlength: 500 })
    description: string;

    @Prop({ required: true, enum: TransactionType })
    type: TransactionType;

    @Prop({ type: Types.ObjectId, ref: 'FinanceCategory', required: false })
    categoryId?: Types.ObjectId;

    @Prop({ trim: true, maxlength: 100 })
    notes?: string;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ type: String, trim: true, maxlength: 50 })
    paymentMethod?: string;

    @Prop({ type: String, trim: true, maxlength: 200 })
    reference?: string;
}

@Schema({ timestamps: true })
export class RecurringTransaction {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    /**
     * Transaction template - embedded object containing all transaction data
     * This template is used to generate actual transactions
     */
    @Prop({ type: TransactionTemplate, required: true })
    template: TransactionTemplate;

    /**
     * Frequency of recurrence
     * - daily: Every day
     * - weekly: Every week
     * - monthly: Every month
     * - yearly: Every year
     * - custom: Custom interval (requires interval field)
     */
    @Prop({ required: true, enum: RecurringFrequency })
    frequency: RecurringFrequency;

    /**
     * Interval for custom frequency
     * e.g., if frequency is 'custom' and interval is 3, it means every 3 days/weeks/months
     * Only used when frequency is 'custom'
     */
    @Prop({ type: Number, min: 1, default: 1 })
    interval: number;

    /**
     * Start date - when the recurring transaction should start generating
     */
    @Prop({ required: true, type: Date })
    startDate: Date;

    /**
     * End date - when the recurring transaction should stop generating (optional)
     * If not provided, the recurring transaction will continue indefinitely
     */
    @Prop({ type: Date, required: false })
    endDate?: Date;

    /**
     * Next run date - when the next transaction should be generated
     * Updated after each generation
     */
    @Prop({ required: true, type: Date })
    nextRunDate: Date;

    /**
     * Whether the recurring transaction is active
     * Can be paused/resumed without deleting
     */
    @Prop({ default: true, type: Boolean })
    isActive: boolean;

    /**
     * Last run date - when the last transaction was generated
     */
    @Prop({ type: Date, required: false })
    lastRunDate?: Date;

    /**
     * Run count - number of times transactions have been generated
     */
    @Prop({ default: 0, type: Number })
    runCount: number;
}

export const RecurringTransactionSchema = SchemaFactory.createForClass(RecurringTransaction);

// Apply soft delete plugin
RecurringTransactionSchema.plugin(softDeletePlugin);

// Indexes for efficient querying
// Index for finding active recurring transactions by user and next run date (for cron job)
RecurringTransactionSchema.index({ userId: 1, isActive: 1, nextRunDate: 1 });

// Index for listing recurring transactions by user
RecurringTransactionSchema.index({ userId: 1, createdAt: -1 });

// Index for filtering by frequency
RecurringTransactionSchema.index({ userId: 1, frequency: 1 });

// Index for filtering by active status
RecurringTransactionSchema.index({ userId: 1, isActive: 1 });

// Compound index for common query pattern (user + deletedAt)
RecurringTransactionSchema.index({ userId: 1, deletedAt: 1 });

// Index for text search on template description
RecurringTransactionSchema.index({ userId: 1, 'template.description': 'text' });

// Note: deletedAt index is created by softDeletePlugin

