import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { FinanceImportService, ColumnMapping } from '../services/finance-import.service';
import { ColumnMappingDto } from '../dto/import/column-mapping.dto';
import { ImportHistoryResponseDto } from '../dto/import/import-history-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OwnerOnlyGuard } from '../../auth/guards/owner-only.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { plainToInstance } from 'class-transformer';
import { successResponse } from '../../../common/responses/response.util';
import { SuccessResponse } from '../../../common/responses/response.interface';

/**
 * Finance Import Controller
 * 
 * Owner-only endpoints for importing transactions from CSV/Excel files.
 */
@Controller('finance/import')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for import endpoints
export class FinanceImportController {
    constructor(private readonly financeImportService: FinanceImportService) { }

    /**
     * Preview import (validate file and return preview)
     * POST /api/v1/finance/import/preview
     */
    @Post('preview')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    async previewImport(
        @GetUser() user: any,
        @UploadedFile() file: Express.Multer.File,
        @Body() columnMappingDto: ColumnMappingDto,
    ): Promise<SuccessResponse<any>> {
        if (!file) {
            throw new Error('File is required');
        }

        const columnMapping: ColumnMapping = {
            date: columnMappingDto.date,
            type: columnMappingDto.type,
            amount: columnMappingDto.amount,
            description: columnMappingDto.description,
            category: columnMappingDto.category,
            notes: columnMappingDto.notes,
            tags: columnMappingDto.tags,
            paymentMethod: columnMappingDto.paymentMethod,
            reference: columnMappingDto.reference,
            currency: columnMappingDto.currency,
        };

        const fileType = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')
            ? 'xlsx'
            : 'csv';

        const preview = fileType === 'xlsx'
            ? await this.financeImportService.previewExcelImport(file.buffer, columnMapping)
            : await this.financeImportService.previewCsvImport(file.buffer, columnMapping);

        return successResponse(preview, 'Import preview generated successfully');
    }

    /**
     * Import transactions
     * POST /api/v1/finance/import
     */
    @Post()
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    async importTransactions(
        @GetUser() user: any,
        @UploadedFile() file: Express.Multer.File,
        @Body() columnMappingDto: ColumnMappingDto,
    ): Promise<SuccessResponse<any>> {
        if (!file) {
            throw new Error('File is required');
        }

        const columnMapping: ColumnMapping = {
            date: columnMappingDto.date,
            type: columnMappingDto.type,
            amount: columnMappingDto.amount,
            description: columnMappingDto.description,
            category: columnMappingDto.category,
            notes: columnMappingDto.notes,
            tags: columnMappingDto.tags,
            paymentMethod: columnMappingDto.paymentMethod,
            reference: columnMappingDto.reference,
            currency: columnMappingDto.currency,
        };

        const fileType = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')
            ? 'xlsx'
            : 'csv';

        const result = await this.financeImportService.importTransactions(
            user.userId,
            file.buffer,
            file.originalname,
            fileType,
            columnMapping,
        );

        return successResponse(
            result,
            `Successfully imported ${result.importedCount} transaction(s). ${result.failedCount} failed.`,
        );
    }

    /**
     * Get import history
     * GET /api/v1/finance/import/history
     */
    @Get('history')
    @HttpCode(HttpStatus.OK)
    async getImportHistory(
        @GetUser() user: any,
        @Query('limit') limit?: string,
    ): Promise<SuccessResponse<ImportHistoryResponseDto[]>> {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        const history = await this.financeImportService.getImportHistory(user.userId, limitNum);

        const historyDto = history.map((item) =>
            plainToInstance(ImportHistoryResponseDto, item.toObject(), {
                excludeExtraneousValues: true,
            }),
        );

        return successResponse(historyDto, 'Import history retrieved successfully');
    }

    /**
     * Get import history by ID
     * GET /api/v1/finance/import/history/:id
     */
    @Get('history/:id')
    @HttpCode(HttpStatus.OK)
    async getImportHistoryById(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<ImportHistoryResponseDto>> {
        const history = await this.financeImportService.getImportHistoryById(user.userId, id);

        const historyDto = plainToInstance(ImportHistoryResponseDto, history.toObject(), {
            excludeExtraneousValues: true,
        });

        return successResponse(historyDto, 'Import history retrieved successfully');
    }
}

