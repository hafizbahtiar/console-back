import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsArray, ValidateNested, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { GoalCategory } from '../../schemas/finance-financial-goal.schema';

class MilestoneDto {
    @IsNumber()
    @Min(0.01)
    @IsOptional()
    amount?: number;

    @IsString()
    @IsOptional()
    label?: string;

    @IsBoolean()
    @IsOptional()
    achieved?: boolean;
}

export class UpdateFinancialGoalDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @Min(0.01)
    @IsOptional()
    targetAmount?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    currentAmount?: number;

    @IsEnum(GoalCategory)
    @IsOptional()
    category?: GoalCategory;

    @IsDateString()
    @IsOptional()
    targetDate?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MilestoneDto)
    @IsOptional()
    milestones?: MilestoneDto[];

    @IsBoolean()
    @IsOptional()
    achieved?: boolean;
}

