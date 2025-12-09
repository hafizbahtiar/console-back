import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type SkillDocument = Skill & Document;

@Schema({ timestamps: true })
export class Skill {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    category: string; // e.g., 'Frontend', 'Backend', 'Database', 'DevOps', etc.

    @Prop()
    level?: number; // 1-5 or percentage 0-100

    @Prop()
    icon?: string;

    @Prop()
    color?: string;

    @Prop({ default: 0 })
    order: number;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);

// Apply soft delete plugin
SkillSchema.plugin(softDeletePlugin);

// Indexes
SkillSchema.index({ userId: 1, category: 1 });
SkillSchema.index({ userId: 1, order: 1 });
SkillSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
// Note: deletedAt index is created by softDeletePlugin

