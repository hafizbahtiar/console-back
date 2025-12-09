import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
    EXPENSE = 'expense',
    INCOME = 'income',
}

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, type: Number, min: 0 })
    amount: number;

    @Prop({ type: String, required: true, default: 'MYR', uppercase: true, maxlength: 3 })
    currency: string; // ISO 4217 currency code (e.g., 'MYR', 'USD', 'EUR')

    @Prop({ type: Number, required: false, min: 0 })
    exchangeRate?: number; // Exchange rate at transaction time (from transaction currency to base currency)

    @Prop({ type: Number, required: false, min: 0 })
    baseAmount?: number; // Amount in base currency (calculated: amount * exchangeRate)

    @Prop({ type: String, required: false, default: 'MYR', uppercase: true, maxlength: 3 })
    baseCurrency?: string; // User's base currency preference (default: 'MYR')

    @Prop({ required: true, type: Date })
    date: Date;

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
    paymentMethod?: string; // e.g., 'cash', 'card', 'bank_transfer', 'paypal', etc.

    @Prop({ type: String, trim: true, maxlength: 200 })
    reference?: string; // Invoice number, receipt number, etc.

    @Prop({ type: Types.ObjectId, ref: 'RecurringTransaction', required: false })
    recurringTransactionId?: Types.ObjectId; // Reference to the recurring transaction that generated this transaction

    // Receipt attachment fields
    @Prop({ type: String, trim: true })
    receiptUrl?: string; // URL to the receipt file (image or PDF)

    @Prop({ type: String, trim: true, maxlength: 255 })
    receiptFilename?: string; // Original filename of the receipt

    @Prop({ type: String, trim: true, maxlength: 100 })
    receiptMimetype?: string; // MIME type of the receipt file (e.g., 'image/jpeg', 'application/pdf')

    @Prop({ type: Number })
    receiptSize?: number; // File size in bytes

    @Prop({ type: Date })
    receiptUploadedAt?: Date; // When the receipt was uploaded

    // OCR Data fields
    @Prop({ type: Object })
    receiptOcrData?: {
        merchantName?: string;
        merchantAddress?: string;
        date?: Date;
        totalAmount?: number;
        taxAmount?: number;
        subtotal?: number;
        items?: Array<{
            description: string;
            quantity?: number;
            price?: number;
            total?: number;
        }>;
        paymentMethod?: string;
        receiptNumber?: string;
        confidence?: number; // Overall OCR confidence
    };

    @Prop({ type: Types.ObjectId, ref: 'FinanceCategory', required: false })
    suggestedCategoryId?: Types.ObjectId; // Category ID suggested by OCR/ML

    @Prop({ type: Number, min: 0, max: 1 })
    suggestedCategoryConfidence?: number; // Confidence score for suggested category (0-1)

    @Prop({ type: Boolean, default: false })
    ocrApplied?: boolean; // Whether OCR data has been applied to transaction fields

    @Prop({ type: Date })
    ocrAppliedAt?: Date; // Timestamp when OCR data was applied
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Apply soft delete plugin
TransactionSchema.plugin(softDeletePlugin);

// Indexes
TransactionSchema.index({ userId: 1, date: -1 }); // For sorting by date
TransactionSchema.index({ userId: 1, type: 1, date: -1 }); // For filtering by type and sorting
TransactionSchema.index({ userId: 1, categoryId: 1, date: -1 }); // For filtering by category
TransactionSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
TransactionSchema.index({ userId: 1, description: 'text' }); // For text search
TransactionSchema.index({ recurringTransactionId: 1 }); // For filtering by recurring transaction
TransactionSchema.index({ userId: 1, currency: 1 }); // For filtering by currency
// Note: deletedAt index is created by softDeletePlugin

