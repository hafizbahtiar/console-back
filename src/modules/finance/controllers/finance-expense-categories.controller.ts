import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FinanceExpenseCategoriesService } from '../services/finance-expense-categories.service';
import { CreateExpenseCategoryDto } from '../dto/expense-categories/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from '../dto/expense-categories/update-expense-category.dto';
import { ExpenseCategoryResponseDto } from '../dto/expense-categories/expense-category-response.dto';
import { BulkDeleteExpenseCategoryDto } from '../dto/expense-categories/bulk-delete-expense-category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OwnerOnlyGuard } from '../../auth/guards/owner-only.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { plainToInstance } from 'class-transformer';
import {
    successResponse,
    createdResponse,
    noContentResponse,
} from '../../../common/responses/response.util';
import { SuccessResponse } from '../../../common/responses/response.interface';

/**
 * Finance Expense Categories Controller
 * 
 * Owner-only endpoints for managing expense categories.
 * All endpoints require owner role.
 */
@Controller('finance/expense-categories')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for finance endpoints
export class FinanceExpenseCategoriesController {
    constructor(private readonly financeExpenseCategoriesService: FinanceExpenseCategoriesService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createExpenseCategoryDto: CreateExpenseCategoryDto,
    ): Promise<SuccessResponse<ExpenseCategoryResponseDto>> {
        const category = await this.financeExpenseCategoriesService.create(user.userId, createExpenseCategoryDto);
        const categoryDto = plainToInstance(ExpenseCategoryResponseDto, category.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(categoryDto, 'Expense category created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
    ): Promise<SuccessResponse<ExpenseCategoryResponseDto[]>> {
        const categories = await this.financeExpenseCategoriesService.findAll(user.userId);
        const categoriesDto = categories.map((category) =>
            plainToInstance(ExpenseCategoryResponseDto, category.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return successResponse(categoriesDto, 'Expense categories retrieved successfully');
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<ExpenseCategoryResponseDto>> {
        const category = await this.financeExpenseCategoriesService.findOne(user.userId, id);
        const categoryDto = plainToInstance(ExpenseCategoryResponseDto, category.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(categoryDto, 'Expense category retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
    ): Promise<SuccessResponse<ExpenseCategoryResponseDto>> {
        const category = await this.financeExpenseCategoriesService.update(user.userId, id, updateExpenseCategoryDto);
        const categoryDto = plainToInstance(ExpenseCategoryResponseDto, category.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(categoryDto, 'Expense category updated successfully');
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteExpenseCategoryDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.financeExpenseCategoriesService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, `Successfully deleted ${result.deletedCount} expense category(ies)`);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.financeExpenseCategoriesService.remove(user.userId, id);
        return noContentResponse();
    }

    @Patch('reorder')
    @HttpCode(HttpStatus.NO_CONTENT)
    async reorder(
        @GetUser() user: any,
        @Body() body: { categoryIds: string[] },
    ): Promise<null> {
        await this.financeExpenseCategoriesService.reorder(user.userId, body.categoryIds);
        return noContentResponse();
    }
}

