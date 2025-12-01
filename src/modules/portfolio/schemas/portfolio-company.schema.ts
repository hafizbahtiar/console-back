import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../util/soft-delete.plugin';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop()
    logo?: string;

    @Prop()
    website?: string;

    @Prop({ trim: true })
    description?: string;

    @Prop({ trim: true })
    industry?: string;

    @Prop({ trim: true })
    location?: string;

    @Prop()
    foundedYear?: number;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

// Apply soft delete plugin
CompanySchema.plugin(softDeletePlugin);

// Indexes
CompanySchema.index({ userId: 1, name: 1 });
CompanySchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
CompanySchema.index({ deletedAt: 1 });

