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
import { FinanceFinancialGoalsService, FinancialGoalFilters, FinancialGoalSortOptions } from '../services/finance-financial-goals.service';
import { CreateFinancialGoalDto } from '../dto/financial-goals/create-financial-goal.dto';
import { UpdateFinancialGoalDto } from '../dto/financial-goals/update-financial-goal.dto';
import { FinancialGoalResponseDto } from '../dto/financial-goals/financial-goal-response.dto';
import { BulkDeleteFinancialGoalDto } from '../dto/financial-goals/bulk-delete-financial-goal.dto';
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
import { GoalCategory } from '../schemas/finance-financial-goal.schema';

/**
 * Finance Financial Goals Controller
 * 
 * Owner-only endpoints for managing financial goals.
 * All endpoints require owner role.
 */
@Controller('finance/financial-goals')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for finance endpoints
export class FinanceFinancialGoalsController {
    constructor(private readonly financeFinancialGoalsService: FinanceFinancialGoalsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createFinancialGoalDto: CreateFinancialGoalDto,
    ): Promise<SuccessResponse<FinancialGoalResponseDto>> {
        const goal = await this.financeFinancialGoalsService.create(user.userId, createFinancialGoalDto);
        const goalDto = plainToInstance(FinancialGoalResponseDto, goal.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(goalDto, 'Financial goal created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: GoalCategory,
        @Query('achieved') achieved?: string,
        @Query('targetDate') targetDate?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ): Promise<PaginatedResponse<FinancialGoalResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;

        const filters: FinancialGoalFilters = {
            category,
            achieved: achieved === 'true' ? true : achieved === 'false' ? false : undefined,
            targetDate,
            startDate,
            endDate,
            search,
        };

        const sortOptions: FinancialGoalSortOptions = {
            field: sortBy as any,
            order: sortOrder,
        };

        const result = await this.financeFinancialGoalsService.findAll(
            user.userId,
            pageNum,
            limitNum,
            filters,
            sortOptions,
        );

        const goals = result.goals.map((goal) =>
            plainToInstance(FinancialGoalResponseDto, goal.toObject(), {
                excludeExtraneousValues: true,
            }),
        );

        return paginatedResponse(
            goals,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Financial goals retrieved successfully',
        );
    }

    @Get('progress')
    @HttpCode(HttpStatus.OK)
    async findAllWithProgress(
        @GetUser() user: any,
        @Query('category') category?: GoalCategory,
        @Query('achieved') achieved?: string,
        @Query('targetDate') targetDate?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
    ): Promise<SuccessResponse<Array<FinancialGoalResponseDto & { progress: any }>>> {
        const filters: FinancialGoalFilters = {
            category,
            achieved: achieved === 'true' ? true : achieved === 'false' ? false : undefined,
            targetDate,
            startDate,
            endDate,
            search,
        };

        const goalsWithProgress = await this.financeFinancialGoalsService.findAllWithProgress(user.userId, filters);

        const goalsDto = goalsWithProgress.map((item) => ({
            ...plainToInstance(FinancialGoalResponseDto, item, {
                excludeExtraneousValues: true,
            }),
            progress: item.progress,
        }));

        return successResponse(goalsDto, 'Financial goals with progress retrieved successfully');
    }

    @Get('milestones')
    @HttpCode(HttpStatus.OK)
    async getGoalsWithAchievedMilestones(
        @GetUser() user: any,
    ): Promise<SuccessResponse<Array<{ goal: FinancialGoalResponseDto; recentMilestones: any[] }>>> {
        const goalsWithMilestones = await this.financeFinancialGoalsService.getGoalsWithAchievedMilestones(user.userId);

        const goalsDto = goalsWithMilestones.map((item) => ({
            goal: plainToInstance(FinancialGoalResponseDto, item.goal.toObject(), {
                excludeExtraneousValues: true,
            }),
            recentMilestones: item.recentMilestones,
        }));

        return successResponse(goalsDto, 'Goals with achieved milestones retrieved successfully');
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<FinancialGoalResponseDto>> {
        const goal = await this.financeFinancialGoalsService.findOne(user.userId, id);
        const goalDto = plainToInstance(FinancialGoalResponseDto, goal.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(goalDto, 'Financial goal retrieved successfully');
    }

    @Get(':id/progress')
    @HttpCode(HttpStatus.OK)
    async getGoalProgress(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<any>> {
        const progress = await this.financeFinancialGoalsService.calculateGoalProgress(user.userId, id);
        return successResponse(progress, 'Goal progress retrieved successfully');
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateFinancialGoalDto: UpdateFinancialGoalDto,
    ): Promise<SuccessResponse<FinancialGoalResponseDto>> {
        const goal = await this.financeFinancialGoalsService.update(user.userId, id, updateFinancialGoalDto);
        const goalDto = plainToInstance(FinancialGoalResponseDto, goal.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(goalDto, 'Financial goal updated successfully');
    }

    @Post(':id/add-amount')
    @HttpCode(HttpStatus.OK)
    async addAmount(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() body: { amount: number },
    ): Promise<SuccessResponse<FinancialGoalResponseDto>> {
        const goal = await this.financeFinancialGoalsService.addAmount(user.userId, id, body.amount);
        const goalDto = plainToInstance(FinancialGoalResponseDto, goal.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(goalDto, 'Amount added to goal successfully');
    }

    @Post(':id/subtract-amount')
    @HttpCode(HttpStatus.OK)
    async subtractAmount(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() body: { amount: number },
    ): Promise<SuccessResponse<FinancialGoalResponseDto>> {
        const goal = await this.financeFinancialGoalsService.subtractAmount(user.userId, id, body.amount);
        const goalDto = plainToInstance(FinancialGoalResponseDto, goal.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(goalDto, 'Amount subtracted from goal successfully');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<void> {
        await this.financeFinancialGoalsService.remove(user.userId, id);
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteFinancialGoalDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.financeFinancialGoalsService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(
            result,
            `Successfully deleted ${result.deletedCount} financial goal(s). ${result.failedIds.length} failed.`,
        );
    }
}

