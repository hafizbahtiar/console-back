import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type MerchantCategoryDocument = MerchantCategory & Document;

/**
 * Merchant Category Schema
 * 
 * Maps merchant names to categories for automatic transaction categorization.
 * Used to learn from user behavior and suggest categories for new transactions
 * based on OCR-extracted merchant names.
 */
@Schema({ timestamps: true })
export class MerchantCategory {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    /**
     * Normalized merchant name (lowercase, trimmed, special chars removed)
     * Used for matching against OCR-extracted merchant names
     */
    @Prop({ required: true, trim: true, lowercase: true, maxlength: 200, index: true })
    merchantName: string;

    /**
     * Category ID (can be expense or income category)
     * References FinanceCategory (either ExpenseCategory or IncomeCategory)
     */
    @Prop({ type: Types.ObjectId, ref: 'FinanceCategory', required: true })
    categoryId: Types.ObjectId;

    /**
     * Number of times this merchant has been matched to this category
     * Higher match count = higher confidence
     */
    @Prop({ type: Number, default: 1, min: 1 })
    matchCount: number;

    /**
     * Confidence score (0-1) for this mapping
     * Calculated based on matchCount and user confirmation rate
     */
    @Prop({ type: Number, default: 0.5, min: 0, max: 1 })
    confidence: number;

    /**
     * Last time this mapping was used (for a transaction)
     * Used to prioritize recent mappings
     */
    @Prop({ type: Date, default: Date.now })
    lastUsedAt: Date;
}

export const MerchantCategorySchema = SchemaFactory.createForClass(MerchantCategory);

// Apply soft delete plugin
MerchantCategorySchema.plugin(softDeletePlugin);

// Indexes
// Compound index for finding merchant mapping by user and merchant name
MerchantCategorySchema.index({ userId: 1, merchantName: 1 }, { unique: true });

// Compound index for finding all merchants mapped to a category
MerchantCategorySchema.index({ userId: 1, categoryId: 1 });

// Compound index for common query pattern (active records only)
MerchantCategorySchema.index({ userId: 1, deletedAt: 1 });

// Index for sorting by confidence and last used
MerchantCategorySchema.index({ userId: 1, confidence: -1, lastUsedAt: -1 });

// Note: deletedAt index is created by softDeletePlugin

