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
import { FinanceIncomeCategoriesService } from '../services/finance-income-categories.service';
import { CreateIncomeCategoryDto } from '../dto/income-categories/create-income-category.dto';
import { UpdateIncomeCategoryDto } from '../dto/income-categories/update-income-category.dto';
import { IncomeCategoryResponseDto } from '../dto/income-categories/income-category-response.dto';
import { BulkDeleteIncomeCategoryDto } from '../dto/income-categories/bulk-delete-income-category.dto';
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
 * Finance Income Categories Controller
 * 
 * Owner-only endpoints for managing income categories.
 * All endpoints require owner role.
 */
@Controller('finance/income-categories')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for finance endpoints
export class FinanceIncomeCategoriesController {
    constructor(private readonly financeIncomeCategoriesService: FinanceIncomeCategoriesService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createIncomeCategoryDto: CreateIncomeCategoryDto,
    ): Promise<SuccessResponse<IncomeCategoryResponseDto>> {
        const category = await this.financeIncomeCategoriesService.create(user.userId, createIncomeCategoryDto);
        const categoryDto = plainToInstance(IncomeCategoryResponseDto, category.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(categoryDto, 'Income category created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
    ): Promise<SuccessResponse<IncomeCategoryResponseDto[]>> {
        const categories = await this.financeIncomeCategoriesService.findAll(user.userId);
        const categoriesDto = categories.map((category) =>
            plainToInstance(IncomeCategoryResponseDto, category.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return successResponse(categoriesDto, 'Income categories retrieved successfully');
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<IncomeCategoryResponseDto>> {
        const category = await this.financeIncomeCategoriesService.findOne(user.userId, id);
        const categoryDto = plainToInstance(IncomeCategoryResponseDto, category.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(categoryDto, 'Income category retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateIncomeCategoryDto: UpdateIncomeCategoryDto,
    ): Promise<SuccessResponse<IncomeCategoryResponseDto>> {
        const category = await this.financeIncomeCategoriesService.update(user.userId, id, updateIncomeCategoryDto);
        const categoryDto = plainToInstance(IncomeCategoryResponseDto, category.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(categoryDto, 'Income category updated successfully');
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteIncomeCategoryDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.financeIncomeCategoriesService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, `Successfully deleted ${result.deletedCount} income category(ies)`);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.financeIncomeCategoriesService.remove(user.userId, id);
        return noContentResponse();
    }

    @Patch('reorder')
    @HttpCode(HttpStatus.NO_CONTENT)
    async reorder(
        @GetUser() user: any,
        @Body() body: { categoryIds: string[] },
    ): Promise<null> {
        await this.financeIncomeCategoriesService.reorder(user.userId, body.categoryIds);
        return noContentResponse();
    }
}

