import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type BudgetDocument = Budget & Document;

export enum BudgetPeriod {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

@Schema({ timestamps: true })
export class Budget {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ type: Types.ObjectId, refPath: 'categoryType', required: false, index: true })
    categoryId?: Types.ObjectId;

    @Prop({ type: String, enum: ['ExpenseCategory', 'IncomeCategory'], required: false })
    categoryType?: 'ExpenseCategory' | 'IncomeCategory';

    @Prop({ required: true, min: 0.01 })
    amount: number;

    @Prop({ required: true, enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
    period: BudgetPeriod;

    @Prop({ required: true, type: Date })
    startDate: Date;

    @Prop({ type: Date, required: false })
    endDate?: Date;

    @Prop({
        type: {
            warning: { type: Number, default: 50 }, // 50% threshold
            critical: { type: Number, default: 80 }, // 80% threshold
            exceeded: { type: Number, default: 100 }, // 100% threshold
        },
        required: false,
        default: { warning: 50, critical: 80, exceeded: 100 },
    })
    alertThresholds?: {
        warning: number;
        critical: number;
        exceeded: number;
    };

    @Prop({ type: Boolean, default: false })
    rolloverEnabled: boolean;

    @Prop({ type: String, required: false })
    description?: string;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);

// Apply soft delete plugin
BudgetSchema.plugin(softDeletePlugin);

// Indexes
BudgetSchema.index({ userId: 1, period: 1, startDate: 1 });
BudgetSchema.index({ userId: 1, categoryId: 1 });
BudgetSchema.index({ userId: 1, createdAt: -1 });
BudgetSchema.index({ userId: 1, deletedAt: 1 });

