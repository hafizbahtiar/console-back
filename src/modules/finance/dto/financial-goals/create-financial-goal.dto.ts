import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GoalCategory } from '../../schemas/finance-financial-goal.schema';

class MilestoneDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsString()
    label: string;
}

export class CreateFinancialGoalDto {
    @IsString()
    name: string;

    @IsNumber()
    @Min(0.01)
    targetAmount: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    currentAmount?: number;

    @IsEnum(GoalCategory)
    category: GoalCategory;

    @IsDateString()
    targetDate: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MilestoneDto)
    @IsOptional()
    milestones?: MilestoneDto[];
}

