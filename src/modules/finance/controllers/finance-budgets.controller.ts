import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FinanceBudgetsService, BudgetFilters, BudgetSortOptions } from '../services/finance-budgets.service';
import { CreateBudgetDto } from '../dto/budgets/create-budget.dto';
import { UpdateBudgetDto } from '../dto/budgets/update-budget.dto';
import { BudgetResponseDto } from '../dto/budgets/budget-response.dto';
import { BulkDeleteBudgetDto } from '../dto/budgets/bulk-delete-budget.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OwnerOnlyGuard } from '../../auth/guards/owner-only.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { plainToInstance } from 'class-transformer';
import {
    successResponse,
    createdResponse,
    paginatedResponse,
    noContentResponse,
    calculatePaginationMeta,
} from '../../../common/responses/response.util';
import { SuccessResponse, PaginatedResponse } from '../../../common/responses/response.interface';
import { BudgetPeriod } from '../schemas/finance-budget.schema';

/**
 * Finance Budgets Controller
 * 
 * Owner-only endpoints for managing budgets.
 * All endpoints require owner role.
 */
@Controller('finance/budgets')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for finance endpoints
export class FinanceBudgetsController {
    constructor(private readonly financeBudgetsService: FinanceBudgetsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createBudgetDto: CreateBudgetDto,
    ): Promise<SuccessResponse<BudgetResponseDto>> {
        const budget = await this.financeBudgetsService.create(user.userId, createBudgetDto);
        const budgetDto = plainToInstance(BudgetResponseDto, budget.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(budgetDto, 'Budget created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('period') period?: BudgetPeriod,
        @Query('categoryId') categoryId?: string,
        @Query('categoryType') categoryType?: 'ExpenseCategory' | 'IncomeCategory',
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ): Promise<PaginatedResponse<BudgetResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;

        const filters: BudgetFilters = {
            period,
            categoryId,
            categoryType,
            startDate,
            endDate,
            search,
        };

        const sortOptions: BudgetSortOptions = {
            field: sortBy as any,
            order: sortOrder,
        };

        const result = await this.financeBudgetsService.findAll(
            user.userId,
            pageNum,
            limitNum,
            filters,
            sortOptions,
        );

        const budgets = result.budgets.map((budget) =>
            plainToInstance(BudgetResponseDto, budget.toObject(), {
                excludeExtraneousValues: true,
            }),
        );

        return paginatedResponse(
            budgets,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Budgets retrieved successfully',
        );
    }

    @Get('stats')
    @HttpCode(HttpStatus.OK)
    async findAllWithStats(
        @GetUser() user: any,
        @Query('period') period?: BudgetPeriod,
        @Query('categoryId') categoryId?: string,
        @Query('categoryType') categoryType?: 'ExpenseCategory' | 'IncomeCategory',
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
    ): Promise<SuccessResponse<Array<BudgetResponseDto & { stats: any }>>> {
        const filters: BudgetFilters = {
            period,
            categoryId,
            categoryType,
            startDate,
            endDate,
            search,
        };

        const budgetsWithStats = await this.financeBudgetsService.findAllWithStats(user.userId, filters);

        const budgetsDto = budgetsWithStats.map((item) => ({
            ...plainToInstance(BudgetResponseDto, item, {
                excludeExtraneousValues: true,
            }),
            stats: item.stats,
        }));

        return successResponse(budgetsDto, 'Budgets with stats retrieved successfully');
    }

    @Get('alerts')
    @HttpCode(HttpStatus.OK)
    async getBudgetAlerts(
        @GetUser() user: any,
    ): Promise<SuccessResponse<Array<{ budget: BudgetResponseDto; stats: any }>>> {
        const alerts = await this.financeBudgetsService.checkBudgetAlerts(user.userId);

        const alertsDto = alerts.map((item) => ({
            budget: plainToInstance(BudgetResponseDto, item.budget.toObject(), {
                excludeExtraneousValues: true,
            }),
            stats: item.stats,
        }));

        return successResponse(alertsDto, 'Budget alerts retrieved successfully');
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<BudgetResponseDto>> {
        const budget = await this.financeBudgetsService.findOne(user.userId, id);
        const budgetDto = plainToInstance(BudgetResponseDto, budget.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(budgetDto, 'Budget retrieved successfully');
    }

    @Get(':id/stats')
    @HttpCode(HttpStatus.OK)
    async getBudgetStats(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<any>> {
        const stats = await this.financeBudgetsService.calculateBudgetStats(user.userId, id);
        return successResponse(stats, 'Budget stats retrieved successfully');
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateBudgetDto: UpdateBudgetDto,
    ): Promise<SuccessResponse<BudgetResponseDto>> {
        const budget = await this.financeBudgetsService.update(user.userId, id, updateBudgetDto);
        const budgetDto = plainToInstance(BudgetResponseDto, budget.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(budgetDto, 'Budget updated successfully');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<void> {
        await this.financeBudgetsService.remove(user.userId, id);
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteBudgetDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.financeBudgetsService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(
            result,
            `Successfully deleted ${result.deletedCount} budget(s). ${result.failedIds.length} failed.`,
        );
    }

    @Post(':id/rollover')
    @HttpCode(HttpStatus.CREATED)
    async processRollover(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<BudgetResponseDto | null>> {
        const rolledOverBudget = await this.financeBudgetsService.processBudgetRollover(user.userId, id);
        
        if (!rolledOverBudget) {
            return successResponse(null, 'Budget rollover not applicable (rollover disabled or no remaining budget)');
        }

        const budgetDto = plainToInstance(BudgetResponseDto, rolledOverBudget.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(budgetDto, 'Budget rolled over successfully');
    }
}

