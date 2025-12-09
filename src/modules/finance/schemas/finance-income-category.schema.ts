import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type IncomeCategoryDocument = IncomeCategory & Document;

@Schema({ timestamps: true })
export class IncomeCategory {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true, maxlength: 100 })
    name: string;

    @Prop({ trim: true, maxlength: 7 })
    color?: string; // Hex color code (e.g., '#33FF57')

    @Prop({ trim: true, maxlength: 50 })
    icon?: string; // Icon name or URL

    @Prop({ default: 0 })
    order: number;

    @Prop({ trim: true, maxlength: 500 })
    description?: string;
}

export const IncomeCategorySchema = SchemaFactory.createForClass(IncomeCategory);

// Apply soft delete plugin
IncomeCategorySchema.plugin(softDeletePlugin);

// Indexes
IncomeCategorySchema.index({ userId: 1, order: 1 }); // For sorting
IncomeCategorySchema.index({ userId: 1, name: 1 }); // For unique name per user
IncomeCategorySchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
// Note: deletedAt index is created by softDeletePlugin

