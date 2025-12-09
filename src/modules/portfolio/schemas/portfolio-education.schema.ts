import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type EducationDocument = Education & Document;

@Schema({ timestamps: true })
export class Education {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    institution: string;

    @Prop({ required: true, trim: true })
    degree: string;

    @Prop({ trim: true })
    field?: string;

    @Prop({ required: true })
    startDate: Date;

    @Prop()
    endDate?: Date;

    @Prop()
    gpa?: number;

    @Prop({ trim: true })
    description?: string;
}

export const EducationSchema = SchemaFactory.createForClass(Education);

// Apply soft delete plugin
EducationSchema.plugin(softDeletePlugin);

// Indexes
EducationSchema.index({ userId: 1, startDate: -1 });
EducationSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
// Note: deletedAt index is created by softDeletePlugin

