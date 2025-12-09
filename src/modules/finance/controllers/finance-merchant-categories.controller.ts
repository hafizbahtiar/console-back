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
import { ReceiptCategorizationService } from '../services/receipt-categorization.service';
import { CreateMerchantCategoryDto } from '../dto/merchant-categories/create-merchant-category.dto';
import { UpdateMerchantCategoryDto } from '../dto/merchant-categories/update-merchant-category.dto';
import { MerchantCategoryResponseDto } from '../dto/merchant-categories/merchant-category-response.dto';
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
 * Finance Merchant Categories Controller
 * 
 * Owner-only endpoints for managing merchant category mappings.
 * All endpoints require owner role.
 */
@Controller('finance/merchant-categories')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for finance endpoints
export class FinanceMerchantCategoriesController {
    constructor(private readonly receiptCategorizationService: ReceiptCategorizationService) { }

    /**
     * Create Merchant Category Mapping
     * POST /api/v1/finance/merchant-categories
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createMerchantCategoryDto: CreateMerchantCategoryDto,
    ): Promise<SuccessResponse<MerchantCategoryResponseDto>> {
        const mapping = await this.receiptCategorizationService.create(
            user.userId,
            createMerchantCategoryDto.merchantName,
            createMerchantCategoryDto.categoryId,
        );

        // Get category name for response
        const category = await this.receiptCategorizationService.getCategoryById(
            user.userId,
            mapping.categoryId.toString(),
        );

        const mappingObj = mapping.toObject();
        const mappingDto = plainToInstance(MerchantCategoryResponseDto, {
            ...mappingObj,
            id: mappingObj._id.toString(),
            categoryName: category?.name || 'Unknown',
        }, {
            excludeExtraneousValues: true,
        });

        return createdResponse(mappingDto, 'Merchant category mapping created successfully');
    }

    /**
     * Get All Merchant Category Mappings
     * GET /api/v1/finance/merchant-categories
     */
    @Get()
    async findAll(
        @GetUser() user: any,
    ): Promise<SuccessResponse<MerchantCategoryResponseDto[]>> {
        const mappings = await this.receiptCategorizationService.findAll(user.userId);

        // Populate category names
        const mappingsDto = await Promise.all(
            mappings.map(async (mapping) => {
                const category = await this.receiptCategorizationService.getCategoryById(
                    user.userId,
                    mapping.categoryId.toString(),
                );
                const mappingObj = mapping.toObject();
                return plainToInstance(MerchantCategoryResponseDto, {
                    ...mappingObj,
                    id: mappingObj._id.toString(),
                    categoryName: category?.name || 'Unknown',
                }, {
                    excludeExtraneousValues: true,
                });
            })
        );

        return successResponse(mappingsDto, 'Merchant category mappings retrieved successfully');
    }

    /**
     * Get Single Merchant Category Mapping
     * GET /api/v1/finance/merchant-categories/:id
     */
    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<MerchantCategoryResponseDto>> {
        const mapping = await this.receiptCategorizationService.findOne(user.userId, id);

        // Get category name
        const category = await this.receiptCategorizationService['getCategoryById'](
            user.userId,
            mapping.categoryId.toString(),
        );

        const mappingObj = mapping.toObject();
        const mappingDto = plainToInstance(MerchantCategoryResponseDto, {
            ...mappingObj,
            id: mappingObj._id.toString(),
            categoryName: category?.name || 'Unknown',
        }, {
            excludeExtraneousValues: true,
        });

        return successResponse(mappingDto, 'Merchant category mapping retrieved successfully');
    }

    /**
     * Update Merchant Category Mapping
     * PATCH /api/v1/finance/merchant-categories/:id
     */
    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateMerchantCategoryDto: UpdateMerchantCategoryDto,
    ): Promise<SuccessResponse<MerchantCategoryResponseDto>> {
        const mapping = await this.receiptCategorizationService.update(
            user.userId,
            id,
            updateMerchantCategoryDto.merchantName,
            updateMerchantCategoryDto.categoryId,
        );

        // Get category name
        const category = await this.receiptCategorizationService['getCategoryById'](
            user.userId,
            mapping.categoryId.toString(),
        );

        const mappingObj = mapping.toObject();
        const mappingDto = plainToInstance(MerchantCategoryResponseDto, {
            ...mappingObj,
            id: mappingObj._id.toString(),
            categoryName: category?.name || 'Unknown',
        }, {
            excludeExtraneousValues: true,
        });

        return successResponse(mappingDto, 'Merchant category mapping updated successfully');
    }

    /**
     * Delete Merchant Category Mapping
     * DELETE /api/v1/finance/merchant-categories/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.receiptCategorizationService.remove(user.userId, id);
        return noContentResponse();
    }
}

