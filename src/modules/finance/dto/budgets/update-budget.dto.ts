import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsBoolean, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BudgetPeriod } from '../../schemas/finance-budget.schema';

class AlertThresholdsDto {
    @IsNumber()
    @Min(0)
    @IsOptional()
    warning?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    critical?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    exceeded?: number;
}

export class UpdateBudgetDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    categoryId?: string;

    @IsString()
    @IsEnum(['ExpenseCategory', 'IncomeCategory'])
    @IsOptional()
    categoryType?: 'ExpenseCategory' | 'IncomeCategory';

    @IsNumber()
    @Min(0.01)
    @IsOptional()
    amount?: number;

    @IsEnum(BudgetPeriod)
    @IsOptional()
    period?: BudgetPeriod;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsObject()
    @ValidateNested()
    @Type(() => AlertThresholdsDto)
    @IsOptional()
    alertThresholds?: AlertThresholdsDto;

    @IsBoolean()
    @IsOptional()
    rolloverEnabled?: boolean;

    @IsString()
    @IsOptional()
    description?: string;
}

