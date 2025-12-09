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
import { FinanceFilterPresetsService } from '../services/finance-filter-presets.service';
import { CreateFilterPresetDto } from '../dto/filter-presets/create-filter-preset.dto';
import { UpdateFilterPresetDto } from '../dto/filter-presets/update-filter-preset.dto';
import { FilterPresetResponseDto } from '../dto/filter-presets/filter-preset-response.dto';
import { BulkDeleteFilterPresetDto } from '../dto/filter-presets/bulk-delete-filter-preset.dto';
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
 * Finance Filter Presets Controller
 * 
 * Owner-only endpoints for managing filter presets.
 * All endpoints require owner role.
 */
@Controller('finance/filter-presets')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for finance endpoints
export class FinanceFilterPresetsController {
    constructor(private readonly financeFilterPresetsService: FinanceFilterPresetsService) { }

    /**
     * Create Filter Preset
     * POST /api/v1/finance/filter-presets
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createFilterPresetDto: CreateFilterPresetDto,
    ): Promise<SuccessResponse<FilterPresetResponseDto>> {
        const filterPreset = await this.financeFilterPresetsService.create(user.userId, createFilterPresetDto);
        const filterPresetDto = plainToInstance(FilterPresetResponseDto, filterPreset.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(filterPresetDto, 'Filter preset created successfully');
    }

    /**
     * List Filter Presets
     * GET /api/v1/finance/filter-presets
     */
    @Get()
    async findAll(
        @GetUser() user: any,
    ): Promise<SuccessResponse<FilterPresetResponseDto[]>> {
        const filterPresets = await this.financeFilterPresetsService.findAll(user.userId);
        const filterPresetsDto = filterPresets.map((filterPreset) =>
            plainToInstance(FilterPresetResponseDto, filterPreset.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return successResponse(filterPresetsDto, 'Filter presets retrieved successfully');
    }

    /**
     * Get Filter Preset
     * GET /api/v1/finance/filter-presets/:id
     */
    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<FilterPresetResponseDto>> {
        const filterPreset = await this.financeFilterPresetsService.findOne(user.userId, id);
        const filterPresetDto = plainToInstance(FilterPresetResponseDto, filterPreset.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(filterPresetDto, 'Filter preset retrieved successfully');
    }

    /**
     * Update Filter Preset
     * PATCH /api/v1/finance/filter-presets/:id
     */
    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateFilterPresetDto: UpdateFilterPresetDto,
    ): Promise<SuccessResponse<FilterPresetResponseDto>> {
        const filterPreset = await this.financeFilterPresetsService.update(user.userId, id, updateFilterPresetDto);
        const filterPresetDto = plainToInstance(FilterPresetResponseDto, filterPreset.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(filterPresetDto, 'Filter preset updated successfully');
    }

    /**
     * Delete Filter Preset
     * DELETE /api/v1/finance/filter-presets/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<null> {
        await this.financeFilterPresetsService.remove(user.userId, id);
        return noContentResponse();
    }

    /**
     * Bulk Delete Filter Presets
     * POST /api/v1/finance/filter-presets/bulk-delete
     */
    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteFilterPresetDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.financeFilterPresetsService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, 'Filter presets deleted successfully');
    }

    /**
     * Set Default Filter Preset
     * PATCH /api/v1/finance/filter-presets/:id/set-default
     */
    @Patch(':id/set-default')
    async setDefault(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<FilterPresetResponseDto>> {
        const filterPreset = await this.financeFilterPresetsService.setDefault(user.userId, id);
        const filterPresetDto = plainToInstance(FilterPresetResponseDto, filterPreset.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(filterPresetDto, 'Default filter preset set successfully');
    }

    /**
     * Get Default Filter Preset
     * GET /api/v1/finance/filter-presets/default
     */
    @Get('default')
    async getDefault(
        @GetUser() user: any,
    ): Promise<SuccessResponse<FilterPresetResponseDto | null>> {
        const filterPreset = await this.financeFilterPresetsService.getDefault(user.userId);
        if (!filterPreset) {
            return successResponse(null, 'No default filter preset found');
        }
        const filterPresetDto = plainToInstance(FilterPresetResponseDto, filterPreset.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(filterPresetDto, 'Default filter preset retrieved successfully');
    }
}
