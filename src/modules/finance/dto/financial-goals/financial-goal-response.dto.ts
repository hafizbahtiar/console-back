import { Exclude, Expose, Transform } from 'class-transformer';
import { GoalCategory } from '../../schemas/finance-financial-goal.schema';

@Exclude()
export class MilestoneResponseDto {
    @Expose()
    amount: number;

    @Expose()
    label: string;

    @Expose()
    achieved: boolean;

    @Expose()
    achievedAt?: Date;
}

@Exclude()
export class FinancialGoalResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    name: string;

    @Expose()
    targetAmount: number;

    @Expose()
    currentAmount: number;

    @Expose()
    category: GoalCategory;

    @Expose()
    targetDate: Date;

    @Expose()
    description?: string;

    @Expose()
    @Transform(({ obj }) => obj.milestones || [])
    milestones: MilestoneResponseDto[];

    @Expose()
    achieved: boolean;

    @Expose()
    achievedAt?: Date;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

