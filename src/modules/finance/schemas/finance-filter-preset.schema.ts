import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';
import { TransactionType } from './finance-transaction.schema';

export type FilterPresetDocument = FilterPreset & Document;

/**
 * Filter configuration - embedded object containing filter settings
 * This matches the TransactionFilters interface
 */
export interface FilterConfig {
    type?: TransactionType;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    tags?: string[];
    paymentMethod?: string;
}

// Create the embedded schema using raw Mongoose schema
export const FilterConfigSchema = new mongoose.Schema({
    type: { type: String, enum: Object.values(TransactionType) },
    categoryId: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    search: { type: String },
    tags: { type: [String], default: [] },
    paymentMethod: { type: String },
}, { _id: false });

/**
 * Filter Preset Schema
 * 
 * Stores saved filter configurations for transaction queries.
 * Allows users to save and reuse common filter combinations.
 */
@Schema({ timestamps: true })
export class FilterPreset {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true, maxlength: 100 })
    name: string;

    /**
     * Filter configuration matching TransactionFilters interface
     */
    @Prop({ type: FilterConfigSchema, required: true })
    filters: FilterConfig;

    @Prop({ trim: true, maxlength: 500 })
    description?: string;

    @Prop({ default: false })
    isDefault: boolean; // Whether this is the default filter preset for the user
}

export const FilterPresetSchema = SchemaFactory.createForClass(FilterPreset);

// Apply soft delete plugin
FilterPresetSchema.plugin(softDeletePlugin);

// Indexes
FilterPresetSchema.index({ userId: 1, name: 1 }); // For unique name per user
FilterPresetSchema.index({ userId: 1, isDefault: 1 }); // For finding default preset
FilterPresetSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
// Note: deletedAt index is created by softDeletePlugin

// Note: If you need custom validation, add it in the service layer or use pre-save hooks.

