import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';
import { TransactionType } from './finance-transaction.schema';

export type TransactionTemplateDocument = TransactionTemplate & Document;

/**
 * Transaction Template Schema
 * 
 * Standalone transaction templates that users can save and reuse.
 * Separate from recurring transactions - these are just saved templates
 * for quick transaction creation.
 */
@Schema({ timestamps: true })
export class TransactionTemplate {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    /**
     * Template name - user-friendly name for the template
     */
    @Prop({ required: true, trim: true, maxlength: 200 })
    name: string;

    /**
     * Transaction amount
     */
    @Prop({ required: true, type: Number, min: 0 })
    amount: number;

    /**
     * Transaction description
     */
    @Prop({ required: true, trim: true, maxlength: 500 })
    description: string;

    /**
     * Transaction type (expense or income)
     */
    @Prop({ required: true, enum: TransactionType })
    type: TransactionType;

    /**
     * Category ID (optional)
     */
    @Prop({ type: Types.ObjectId, ref: 'FinanceCategory', required: false })
    categoryId?: Types.ObjectId;

    /**
     * Notes (optional)
     */
    @Prop({ trim: true, maxlength: 100 })
    notes?: string;

    /**
     * Tags for organization
     */
    @Prop({ type: [String], default: [] })
    tags: string[];

    /**
     * Payment method (optional)
     */
    @Prop({ type: String, trim: true, maxlength: 50 })
    paymentMethod?: string;

    /**
     * Reference (optional)
     */
    @Prop({ type: String, trim: true, maxlength: 200 })
    reference?: string;

    /**
     * Template category/tag for grouping templates
     */
    @Prop({ type: String, trim: true, maxlength: 50 })
    category?: string;

    /**
     * Usage count - tracks how many times this template has been used
     */
    @Prop({ default: 0, type: Number })
    usageCount: number;

    /**
     * Last used date - when this template was last used
     */
    @Prop({ type: Date, required: false })
    lastUsedAt?: Date;
}

export const TransactionTemplateSchema = SchemaFactory.createForClass(TransactionTemplate);

// Apply soft delete plugin
TransactionTemplateSchema.plugin(softDeletePlugin);

// Indexes
TransactionTemplateSchema.index({ userId: 1, createdAt: -1 }); // For listing by user
TransactionTemplateSchema.index({ userId: 1, category: 1 }); // For filtering by category
TransactionTemplateSchema.index({ userId: 1, usageCount: -1 }); // For sorting by most used
TransactionTemplateSchema.index({ userId: 1, name: 'text', description: 'text' }); // For text search
TransactionTemplateSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
// Note: deletedAt index is created by softDeletePlugin

