import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    platform: string; // e.g., 'GitHub', 'LinkedIn', 'Twitter', etc.

    @Prop({ required: true, trim: true })
    url: string;

    @Prop()
    icon?: string;

    @Prop({ default: 0 })
    order: number;

    @Prop({ default: true })
    active: boolean;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

// Apply soft delete plugin
ContactSchema.plugin(softDeletePlugin);

// Indexes
ContactSchema.index({ userId: 1, active: 1, order: 1 });
ContactSchema.index({ userId: 1, order: 1 });
ContactSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
// Note: deletedAt index is created by softDeletePlugin

