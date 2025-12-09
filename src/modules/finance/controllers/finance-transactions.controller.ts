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
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { FinanceTransactionsService, TransactionFilters, TransactionSortOptions } from '../services/finance-transactions.service';
import { FinanceSearchService } from '../services/finance-search.service';
import { Types } from 'mongoose';
import { CreateTransactionDto } from '../dto/transactions/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/transactions/update-transaction.dto';
import { TransactionResponseDto } from '../dto/transactions/transaction-response.dto';
import { BulkDeleteTransactionDto } from '../dto/transactions/bulk-delete-transaction.dto';
import { DuplicateTransactionDto } from '../dto/transactions/duplicate-transaction.dto';
import { ApplyOcrDataDto } from '../dto/transactions/apply-ocr-data.dto';
import { ReceiptOcrData } from '../services/receipt-ocr.service';
import { ReceiptCategorizationService } from '../services/receipt-categorization.service';
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
import { TransactionType } from '../schemas/finance-transaction.schema';

/**
 * Finance Transactions Controller
 * 
 * Owner-only endpoints for managing financial transactions.
 * All endpoints require owner role.
 */
@Controller('finance/transactions')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for finance endpoints
export class FinanceTransactionsController {
    constructor(
        private readonly financeTransactionsService: FinanceTransactionsService,
        private readonly financeSearchService: FinanceSearchService,
        private readonly receiptCategorizationService: ReceiptCategorizationService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createTransactionDto: CreateTransactionDto,
    ): Promise<SuccessResponse<TransactionResponseDto>> {
        const transaction = await this.financeTransactionsService.create(user.userId, createTransactionDto);
        const transactionDto = plainToInstance(TransactionResponseDto, transaction.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(transactionDto, 'Transaction created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('type') type?: TransactionType,
        @Query('categoryId') categoryId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
        @Query('tags') tags?: string, // Comma-separated tags
        @Query('paymentMethod') paymentMethod?: string,
        @Query('currency') currency?: string, // Filter by currency code
        @Query('sortBy') sortBy?: string, // 'date', 'amount', 'createdAt', 'updatedAt'
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ): Promise<PaginatedResponse<TransactionResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;

        // Build filters
        const filters: TransactionFilters = {};
        if (type) filters.type = type;
        if (categoryId) filters.categoryId = categoryId;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (search) filters.search = search;
        if (tags) filters.tags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
        if (paymentMethod) filters.paymentMethod = paymentMethod;
        if (currency) filters.currency = currency.toUpperCase();

        // Build sort options
        const sortOptions: TransactionSortOptions = {};
        if (sortBy) {
            const validSortFields = ['date', 'amount', 'createdAt', 'updatedAt'];
            if (validSortFields.includes(sortBy)) {
                sortOptions.field = sortBy as any;
            }
        }
        if (sortOrder) {
            sortOptions.order = sortOrder;
        }

        const result = await this.financeTransactionsService.findAll(
            user.userId,
            pageNum,
            limitNum,
            Object.keys(filters).length > 0 ? filters : undefined,
            Object.keys(sortOptions).length > 0 ? sortOptions : undefined,
        );

        const transactions = result.transactions.map((transaction) =>
            plainToInstance(TransactionResponseDto, transaction.toObject(), {
                excludeExtraneousValues: true,
            }),
        );

        return paginatedResponse(
            transactions,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Transactions retrieved successfully',
        );
    }

    @Get('statistics')
    async getStatistics(
        @GetUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<SuccessResponse<{
        totalIncome: number;
        totalExpenses: number;
        netAmount: number;
        transactionCount: number;
    }>> {
        const statistics = await this.financeTransactionsService.getStatistics(
            user.userId,
            startDate,
            endDate,
        );
        return successResponse(statistics, 'Statistics retrieved successfully');
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<TransactionResponseDto>> {
        const transaction = await this.financeTransactionsService.findOne(user.userId, id);
        const transactionDto = plainToInstance(TransactionResponseDto, transaction.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(transactionDto, 'Transaction retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateTransactionDto: UpdateTransactionDto,
    ): Promise<SuccessResponse<TransactionResponseDto>> {
        const transaction = await this.financeTransactionsService.update(user.userId, id, updateTransactionDto);
        const transactionDto = plainToInstance(TransactionResponseDto, transaction.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(transactionDto, 'Transaction updated successfully');
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteTransactionDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.financeTransactionsService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, `Successfully deleted ${result.deletedCount} transaction(s)`);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.financeTransactionsService.remove(user.userId, id);
        return noContentResponse();
    }

    @Post(':id/save-as-template')
    @HttpCode(HttpStatus.CREATED)
    async saveAsTemplate(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() body: { name: string; category?: string },
    ): Promise<SuccessResponse<any>> {
        const template = await this.financeTransactionsService.saveAsTemplate(
            user.userId,
            id,
            body.name,
            body.category,
        );
        return createdResponse(template.toObject(), 'Transaction template created successfully');
    }

    @Post('from-template/:templateId')
    @HttpCode(HttpStatus.CREATED)
    async createFromTemplate(
        @GetUser() user: any,
        @Param('templateId') templateId: string,
        @Body() body: { date: string },
    ): Promise<SuccessResponse<TransactionResponseDto>> {
        const transaction = await this.financeTransactionsService.createFromTemplate(
            user.userId,
            templateId,
            body.date,
        );
        const transactionDto = plainToInstance(TransactionResponseDto, transaction.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(transactionDto, 'Transaction created from template successfully');
    }

    @Post(':id/duplicate')
    @HttpCode(HttpStatus.CREATED)
    async duplicate(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() duplicateDto: DuplicateTransactionDto,
    ): Promise<SuccessResponse<TransactionResponseDto>> {
        const transaction = await this.financeTransactionsService.duplicate(
            user.userId,
            id,
            duplicateDto.dateAdjustment,
        );
        const transactionDto = plainToInstance(TransactionResponseDto, transaction.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(transactionDto, 'Transaction duplicated successfully');
    }

    @Post('bulk-duplicate')
    @HttpCode(HttpStatus.OK)
    async bulkDuplicate(
        @GetUser() user: any,
        @Body() body: { ids: string[]; dateAdjustment?: number },
    ): Promise<SuccessResponse<{ duplicatedCount: number; failedIds: string[]; transactions: TransactionResponseDto[] }>> {
        const result = await this.financeTransactionsService.bulkDuplicate(
            user.userId,
            body.ids,
            body.dateAdjustment,
        );
        const transactionsDto = result.transactions.map((transaction) =>
            plainToInstance(TransactionResponseDto, transaction.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return successResponse(
            {
                duplicatedCount: result.duplicatedCount,
                failedIds: result.failedIds,
                transactions: transactionsDto,
            },
            `Successfully duplicated ${result.duplicatedCount} transaction(s)`,
        );
    }

    /**
     * Search Suggestions
     * GET /api/v1/finance/transactions/search/suggestions
     * Returns search suggestions based on transaction history
     */
    @Get('search/suggestions')
    async getSearchSuggestions(
        @GetUser() user: any,
        @Query('query') query?: string,
        @Query('limit') limit?: string,
    ): Promise<SuccessResponse<Array<{
        text: string;
        type: 'description' | 'note' | 'reference' | 'tag' | 'paymentMethod';
        count: number;
    }>>> {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const suggestions = await this.financeSearchService.getSearchSuggestions(
            user.userId,
            query,
            limitNum,
        );
        return successResponse(suggestions, 'Search suggestions retrieved successfully');
    }

    /**
     * Search Analytics
     * GET /api/v1/finance/transactions/search/analytics
     * Returns search analytics (popular searches, patterns)
     */
    @Get('search/analytics')
    async getSearchAnalytics(
        @GetUser() user: any,
        @Query('limit') limit?: string,
    ): Promise<SuccessResponse<{
        popularDescriptions: Array<{ text: string; count: number }>;
        popularTags: Array<{ text: string; count: number }>;
        popularPaymentMethods: Array<{ text: string; count: number }>;
    }>> {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const analytics = await this.financeSearchService.getSearchAnalytics(user.userId, limitNum);
        return successResponse(analytics, 'Search analytics retrieved successfully');
    }

    /**
     * Extract Receipt OCR Data
     * POST /api/v1/finance/transactions/:id/receipt/extract
     * Extract transaction details from receipt image using OCR
     */
    @Post(':id/receipt/extract')
    @HttpCode(HttpStatus.OK)
    async extractReceiptOcr(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<{ receiptOcrData: ReceiptOcrData; suggestedCategory?: { categoryId: string; categoryName: string; confidence: number } }>> {
        const receiptOcrData = await this.financeTransactionsService.extractReceiptOcr(user.userId, id);
        
        // Get transaction to check for suggested category
        const transaction = await this.financeTransactionsService.findOne(user.userId, id);
        
        const response: {
            receiptOcrData: ReceiptOcrData;
            suggestedCategory?: { categoryId: string; categoryName: string; confidence: number; source: string };
        } = {
            receiptOcrData,
        };

        // Add suggested category if available
        if (transaction.suggestedCategoryId) {
            // Fetch category name
            const category = await this.receiptCategorizationService.getCategoryById(
                user.userId,
                transaction.suggestedCategoryId.toString(),
            );

            if (category) {
                response.suggestedCategory = {
                    categoryId: transaction.suggestedCategoryId.toString(),
                    categoryName: category.name,
                    confidence: transaction.suggestedCategoryConfidence || 0,
                    source: 'auto_suggested', // Could be enhanced to track source from categorization service
                };
            }
        }

        return successResponse(response, 'Receipt data extracted successfully');
    }

    /**
     * Get Receipt OCR Data
     * GET /api/v1/finance/transactions/:id/receipt/ocr
     * Get current OCR data for a transaction (if exists)
     */
    @Get(':id/receipt/ocr')
    async getReceiptOcr(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<{ receiptOcrData: ReceiptOcrData | null }>> {
        const receiptOcrData = await this.financeTransactionsService.getReceiptOcr(user.userId, id);
        return successResponse({ receiptOcrData }, receiptOcrData ? 'OCR data retrieved successfully' : 'No OCR data found');
    }

    /**
     * Apply OCR Data to Transaction
     * PATCH /api/v1/finance/transactions/:id/apply-ocr
     * Apply extracted OCR data to transaction fields (after user review)
     */
    @Patch(':id/apply-ocr')
    @HttpCode(HttpStatus.OK)
    async applyOcrData(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() applyOcrDataDto: ApplyOcrDataDto,
    ): Promise<SuccessResponse<TransactionResponseDto>> {
        const transaction = await this.financeTransactionsService.applyOcrData(
            user.userId,
            id,
            undefined, // Use stored OCR data
            applyOcrDataDto.fieldsToApply,
        );

        // Override category if provided
        if (applyOcrDataDto.categoryId) {
            transaction.categoryId = new Types.ObjectId(applyOcrDataDto.categoryId);
            await transaction.save();

            // Learn from user override: Update merchant mapping with user's choice
            const storedTransaction = await this.financeTransactionsService.findOne(user.userId, id);
            if (storedTransaction.receiptOcrData?.merchantName) {
                try {
                    await this.receiptCategorizationService.updateMerchantMapping(
                        user.userId,
                        storedTransaction.receiptOcrData.merchantName,
                        applyOcrDataDto.categoryId,
                    );
                } catch (error) {
                    // Log error but don't fail the transaction update
                    // This is a learning mechanism, so failures shouldn't block the main operation
                    console.error('Failed to update merchant mapping from user override:', error);
                }
            }
        }

        const transactionDto = plainToInstance(TransactionResponseDto, transaction.toObject(), {
            excludeExtraneousValues: true,
        });

        return successResponse(transactionDto, 'OCR data applied successfully');
    }

    /**
     * Discard Receipt OCR Data
     * DELETE /api/v1/finance/transactions/:id/receipt/ocr
     * Clear OCR data without applying it
     */
    @Delete(':id/receipt/ocr')
    @HttpCode(HttpStatus.OK)
    async discardReceiptOcr(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<TransactionResponseDto>> {
        const transaction = await this.financeTransactionsService.discardOcrData(user.userId, id);

        const transactionDto = plainToInstance(TransactionResponseDto, transaction.toObject(), {
            excludeExtraneousValues: true,
        });

        return successResponse(transactionDto, 'OCR data discarded successfully');
    }

    /**
     * Upload Receipt
     * POST /api/v1/finance/transactions/:id/receipt
     * Upload a receipt file (image or PDF) for a transaction
     */
    @Post(':id/receipt')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    async uploadReceipt(
        @GetUser() user: any,
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<SuccessResponse<TransactionResponseDto>> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const transaction = await this.financeTransactionsService.uploadReceipt(
            user.userId,
            id,
            file,
        );

        const transactionDto = plainToInstance(TransactionResponseDto, transaction.toObject(), {
            excludeExtraneousValues: true,
        });

        return successResponse(transactionDto, 'Receipt uploaded successfully');
    }

    /**
     * Get Receipt
     * GET /api/v1/finance/transactions/:id/receipt
     * Get receipt URL for a transaction
     */
    /**
     * Get Receipt URL
     * GET /api/v1/finance/transactions/:id/receipt
     * Get receipt URL for a transaction
     * Note: This route must come after /receipt/ocr to avoid route conflicts
     */
    @Get(':id/receipt')
    async getReceipt(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<{ receiptUrl: string }>> {
        const receiptUrl = await this.financeTransactionsService.getReceiptUrl(user.userId, id);
        return successResponse({ receiptUrl }, 'Receipt URL retrieved successfully');
    }

    /**
     * Delete Receipt
     * DELETE /api/v1/finance/transactions/:id/receipt
     * Delete receipt from a transaction
     */
    @Delete(':id/receipt')
    @HttpCode(HttpStatus.OK)
    async deleteReceipt(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<TransactionResponseDto>> {
        const transaction = await this.financeTransactionsService.deleteReceipt(user.userId, id);

        const transactionDto = plainToInstance(TransactionResponseDto, transaction.toObject(), {
            excludeExtraneousValues: true,
        });

        return successResponse(transactionDto, 'Receipt deleted successfully');
    }
}

