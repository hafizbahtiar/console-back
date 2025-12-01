import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../util/soft-delete.plugin';

export type BlogDocument = Blog & Document;

@Schema({ timestamps: true })
export class Blog {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ required: true, unique: true, trim: true, lowercase: true })
    slug: string;

    @Prop({ required: true, type: String })
    content: string;

    @Prop({ trim: true })
    excerpt?: string;

    @Prop()
    coverImage?: string;

    @Prop({ default: false })
    published: boolean;

    @Prop()
    publishedAt?: Date;

    @Prop({ type: [String], default: [] })
    tags: string[];
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

// Apply soft delete plugin
BlogSchema.plugin(softDeletePlugin);

// Indexes
BlogSchema.index({ userId: 1, published: 1, publishedAt: -1 });
BlogSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ deletedAt: 1 });

