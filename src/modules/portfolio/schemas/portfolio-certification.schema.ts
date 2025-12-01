import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../util/soft-delete.plugin';

export type CertificationDocument = Certification & Document;

@Schema({ timestamps: true })
export class Certification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    issuer: string;

    @Prop({ required: true })
    issueDate: Date;

    @Prop()
    expiryDate?: Date;

    @Prop({ trim: true })
    credentialId?: string;

    @Prop()
    credentialUrl?: string;
}

export const CertificationSchema = SchemaFactory.createForClass(Certification);

// Apply soft delete plugin
CertificationSchema.plugin(softDeletePlugin);

// Indexes
CertificationSchema.index({ userId: 1, issueDate: -1 });
CertificationSchema.index({ userId: 1, expiryDate: 1 });
CertificationSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
CertificationSchema.index({ deletedAt: 1 });

