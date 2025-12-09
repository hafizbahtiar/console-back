import { Exclude, Expose, Transform } from 'class-transformer';
import { BudgetPeriod } from '../../schemas/finance-budget.schema';

@Exclude()
export class BudgetResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    name: string;

    @Expose()
    @Transform(({ obj }) => obj.categoryId?.toString() || obj.categoryId || null)
    categoryId?: string;

    @Expose()
    categoryType?: 'ExpenseCategory' | 'IncomeCategory';

    @Expose()
    amount: number;

    @Expose()
    period: BudgetPeriod;

    @Expose()
    startDate: Date;

    @Expose()
    endDate?: Date;

    @Expose()
    alertThresholds?: {
        warning: number;
        critical: number;
        exceeded: number;
    };

    @Expose()
    rolloverEnabled: boolean;

    @Expose()
    description?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

