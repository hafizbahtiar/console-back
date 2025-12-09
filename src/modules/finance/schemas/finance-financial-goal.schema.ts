import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin } from '../../../common/utils/soft-delete.plugin';

export type FinancialGoalDocument = FinancialGoal & Document;

export enum GoalCategory {
    EMERGENCY_FUND = 'emergency_fund',
    VACATION = 'vacation',
    HOUSE = 'house',
    CAR = 'car',
    EDUCATION = 'education',
    RETIREMENT = 'retirement',
    DEBT_PAYOFF = 'debt_payoff',
    INVESTMENT = 'investment',
    OTHER = 'other',
}

@Schema({ timestamps: true })
export class Milestone {
    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    label: string;

    @Prop({ type: Boolean, default: false })
    achieved: boolean;

    @Prop({ type: Date, required: false })
    achievedAt?: Date;
}

@Schema({ timestamps: true })
export class FinancialGoal {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, min: 0.01 })
    targetAmount: number;

    @Prop({ required: true, min: 0, default: 0 })
    currentAmount: number;

    @Prop({ required: true, enum: GoalCategory, default: GoalCategory.OTHER })
    category: GoalCategory;

    @Prop({ required: true, type: Date })
    targetDate: Date;

    @Prop({ type: String, required: false })
    description?: string;

    @Prop({ type: [Milestone], default: [] })
    milestones: Milestone[];

    @Prop({ type: Boolean, default: false })
    achieved: boolean;

    @Prop({ type: Date, required: false })
    achievedAt?: Date;
}

export const FinancialGoalSchema = SchemaFactory.createForClass(FinancialGoal);

// Apply soft delete plugin
FinancialGoalSchema.plugin(softDeletePlugin);

// Indexes
FinancialGoalSchema.index({ userId: 1, category: 1 });
FinancialGoalSchema.index({ userId: 1, targetDate: 1 });
FinancialGoalSchema.index({ userId: 1, achieved: 1 });
FinancialGoalSchema.index({ userId: 1, createdAt: -1 });
FinancialGoalSchema.index({ userId: 1, deletedAt: 1 });

