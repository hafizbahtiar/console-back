import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type ExpenseCategoryDocument = ExpenseCategory & Document;

@Schema({ timestamps: true })
export class ExpenseCategory {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true, maxlength: 100 })
    name: string;

    @Prop({ trim: true, maxlength: 7 })
    color?: string; // Hex color code (e.g., '#FF5733')

    @Prop({ trim: true, maxlength: 50 })
    icon?: string; // Icon name or URL

    @Prop({ default: 0 })
    order: number;

    @Prop({ trim: true, maxlength: 500 })
    description?: string;
}

export const ExpenseCategorySchema = SchemaFactory.createForClass(ExpenseCategory);

// Apply soft delete plugin
ExpenseCategorySchema.plugin(softDeletePlugin);

// Indexes
ExpenseCategorySchema.index({ userId: 1, order: 1 }); // For sorting
ExpenseCategorySchema.index({ userId: 1, name: 1 }); // For unique name per user
ExpenseCategorySchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
// Note: deletedAt index is created by softDeletePlugin

