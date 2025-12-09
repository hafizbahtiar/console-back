import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type TestimonialDocument = Testimonial & Document;

@Schema({ timestamps: true })
export class Testimonial {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true })
    role?: string;

    @Prop({ trim: true })
    company?: string;

    @Prop({ required: true, trim: true })
    content: string;

    @Prop()
    avatar?: string;

    @Prop({ min: 1, max: 5 })
    rating?: number;

    @Prop({ default: false })
    featured: boolean;

    @Prop({ default: 0 })
    order: number;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);

// Apply soft delete plugin
TestimonialSchema.plugin(softDeletePlugin);

// Indexes
TestimonialSchema.index({ userId: 1, featured: 1, order: 1 });
TestimonialSchema.index({ userId: 1, order: 1 });
TestimonialSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
// Note: deletedAt index is created by softDeletePlugin
