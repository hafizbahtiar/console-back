import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImportHistoryDocument = ImportHistory & Document;

@Schema({ timestamps: true })
export class ImportHistory {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    filename: string;

    @Prop({ required: true })
    fileType: string; // 'csv', 'xlsx', etc.

    @Prop({ required: true, type: Number, default: 0 })
    totalRows: number;

    @Prop({ required: true, type: Number, default: 0 })
    importedCount: number;

    @Prop({ required: true, type: Number, default: 0 })
    failedCount: number;

    @Prop({ type: [String], default: [] })
    errors: string[]; // Array of error messages

    @Prop({ required: true, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' })
    status: 'pending' | 'processing' | 'completed' | 'failed';

    @Prop({ type: Object, required: false })
    columnMapping?: Record<string, string>; // Column mapping used for this import

    @Prop({ type: Date, required: false })
    completedAt?: Date;
}

export const ImportHistorySchema = SchemaFactory.createForClass(ImportHistory);

// Indexes
ImportHistorySchema.index({ userId: 1, createdAt: -1 });
ImportHistorySchema.index({ userId: 1, status: 1 });

