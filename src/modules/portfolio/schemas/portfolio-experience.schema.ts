import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../util/soft-delete.plugin';

export type ExperienceDocument = Experience & Document;

@Schema({ timestamps: true })
export class Experience {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Company' })
    companyId?: Types.ObjectId;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ trim: true })
    company?: string; // Can be used if companyId is not set

    @Prop({ trim: true })
    location?: string;

    @Prop({ required: true })
    startDate: Date;

    @Prop()
    endDate?: Date;

    @Prop({ default: false })
    current: boolean;

    @Prop({ trim: true })
    description?: string;

    @Prop({ type: [String], default: [] })
    achievements: string[];

    @Prop({ type: [String], default: [] })
    technologies: string[];
}

export const ExperienceSchema = SchemaFactory.createForClass(Experience);

// Apply soft delete plugin
ExperienceSchema.plugin(softDeletePlugin);

// Indexes
ExperienceSchema.index({ userId: 1, startDate: -1 });
ExperienceSchema.index({ userId: 1, current: 1 });
ExperienceSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
ExperienceSchema.index({ companyId: 1 }); // Index for company relationship
ExperienceSchema.index({ deletedAt: 1 });

