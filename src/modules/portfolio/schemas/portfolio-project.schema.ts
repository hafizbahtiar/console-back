import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ trim: true })
    description?: string;

    @Prop()
    image?: string;

    @Prop()
    url?: string;

    @Prop()
    githubUrl?: string;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ type: [String], default: [] })
    technologies: string[];

    @Prop()
    startDate?: Date;

    @Prop()
    endDate?: Date;

    @Prop({ default: false })
    featured: boolean;

    @Prop({ default: 0 })
    order: number;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Apply soft delete plugin
ProjectSchema.plugin(softDeletePlugin);

// Indexes
ProjectSchema.index({ userId: 1, order: 1 });
ProjectSchema.index({ userId: 1, featured: 1 });
ProjectSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
ProjectSchema.index({ userId: 1, createdAt: -1 }); // For sorting
// Note: deletedAt index is created by softDeletePlugin

