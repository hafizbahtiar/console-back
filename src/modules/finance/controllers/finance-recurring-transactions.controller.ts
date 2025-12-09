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
import {
    FinanceRecurringTransactionsService,
    RecurringTransactionFilters,
} from '../services/finance-recurring-transactions.service';
import { CreateRecurringTransactionDto } from '../dto/recurring-transactions/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from '../dto/recurring-transactions/update-recurring-transaction.dto';
import { RecurringTransactionResponseDto } from '../dto/recurring-transactions/recurring-transaction-response.dto';
import { BulkDeleteRecurringTransactionDto } from '../dto/recurring-transactions/bulk-delete-recurring-transaction.dto';
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
import { RecurringFrequency } from '../schemas/finance-recurring-transaction.schema';
import { TransactionResponseDto } from '../dto/transactions/transaction-response.dto';

/**
 * Finance Recurring Transactions Controller
 * 
 * Owner-only endpoints for managing recurring financial transactions.
 * All endpoints require owner role.
 */
@Controller('finance/recurring-transactions')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for finance endpoints
export class FinanceRecurringTransactionsController {
    constructor(
        private readonly financeRecurringTransactionsService: FinanceRecurringTransactionsService,
    ) { }

    /**
     * Create Recurring Transaction
     * POST /api/v1/finance/recurring-transactions
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createRecurringTransactionDto: CreateRecurringTransactionDto,
    ): Promise<SuccessResponse<RecurringTransactionResponseDto>> {
        const recurringTransaction = await this.financeRecurringTransactionsService.create(
            user.userId,
            createRecurringTransactionDto,
        );
        const recurringTransactionDto = plainToInstance(
            RecurringTransactionResponseDto,
            recurringTransaction.toObject(),
            {
                excludeExtraneousValues: true,
            },
        );
        return createdResponse(
            recurringTransactionDto,
            'Recurring transaction created successfully',
        );
    }

    /**
     * List Recurring Transactions
     * GET /api/v1/finance/recurring-transactions
     */
    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('frequency') frequency?: RecurringFrequency,
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
    ): Promise<SuccessResponse<RecurringTransactionResponseDto[]>> {
        const filters: RecurringTransactionFilters = {};
        if (frequency) filters.frequency = frequency;
        if (isActive !== undefined) {
            filters.isActive = isActive === 'true';
        }
        if (search) filters.search = search;

        const recurringTransactions =
            await this.financeRecurringTransactionsService.findAll(user.userId, filters);
        const recurringTransactionsDto = recurringTransactions.map((rt) =>
            plainToInstance(RecurringTransactionResponseDto, rt.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return successResponse(
            recurringTransactionsDto,
            'Recurring transactions retrieved successfully',
        );
    }

    /**
     * Get Single Recurring Transaction
     * GET /api/v1/finance/recurring-transactions/:id
     */
    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<RecurringTransactionResponseDto>> {
        const recurringTransaction =
            await this.financeRecurringTransactionsService.findOne(user.userId, id);
        const recurringTransactionDto = plainToInstance(
            RecurringTransactionResponseDto,
            recurringTransaction.toObject(),
            {
                excludeExtraneousValues: true,
            },
        );
        return successResponse(
            recurringTransactionDto,
            'Recurring transaction retrieved successfully',
        );
    }

    /**
     * Update Recurring Transaction
     * PATCH /api/v1/finance/recurring-transactions/:id
     */
    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateRecurringTransactionDto: UpdateRecurringTransactionDto,
    ): Promise<SuccessResponse<RecurringTransactionResponseDto>> {
        const recurringTransaction = await this.financeRecurringTransactionsService.update(
            user.userId,
            id,
            updateRecurringTransactionDto,
        );
        const recurringTransactionDto = plainToInstance(
            RecurringTransactionResponseDto,
            recurringTransaction.toObject(),
            {
                excludeExtraneousValues: true,
            },
        );
        return successResponse(
            recurringTransactionDto,
            'Recurring transaction updated successfully',
        );
    }

    /**
     * Delete Recurring Transaction
     * DELETE /api/v1/finance/recurring-transactions/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.financeRecurringTransactionsService.remove(user.userId, id);
        return noContentResponse();
    }

    /**
     * Bulk Delete Recurring Transactions
     * POST /api/v1/finance/recurring-transactions/bulk-delete
     */
    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteRecurringTransactionDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.financeRecurringTransactionsService.bulkDelete(
            user.userId,
            bulkDeleteDto.ids,
        );
        return successResponse(
            result,
            `Successfully deleted ${result.deletedCount} recurring transaction(s)`,
        );
    }

    /**
     * Pause Recurring Transaction
     * PATCH /api/v1/finance/recurring-transactions/:id/pause
     */
    @Patch(':id/pause')
    async pause(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<RecurringTransactionResponseDto>> {
        const recurringTransaction = await this.financeRecurringTransactionsService.pause(
            user.userId,
            id,
        );
        const recurringTransactionDto = plainToInstance(
            RecurringTransactionResponseDto,
            recurringTransaction.toObject(),
            {
                excludeExtraneousValues: true,
            },
        );
        return successResponse(
            recurringTransactionDto,
            'Recurring transaction paused successfully',
        );
    }

    /**
     * Resume Recurring Transaction
     * PATCH /api/v1/finance/recurring-transactions/:id/resume
     */
    @Patch(':id/resume')
    async resume(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<RecurringTransactionResponseDto>> {
        const recurringTransaction = await this.financeRecurringTransactionsService.resume(
            user.userId,
            id,
        );
        const recurringTransactionDto = plainToInstance(
            RecurringTransactionResponseDto,
            recurringTransaction.toObject(),
            {
                excludeExtraneousValues: true,
            },
        );
        return successResponse(
            recurringTransactionDto,
            'Recurring transaction resumed successfully',
        );
    }

    /**
     * Skip Next Occurrence
     * PATCH /api/v1/finance/recurring-transactions/:id/skip-next
     */
    @Patch(':id/skip-next')
    async skipNext(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<RecurringTransactionResponseDto>> {
        const recurringTransaction = await this.financeRecurringTransactionsService.skipNext(
            user.userId,
            id,
        );
        const recurringTransactionDto = plainToInstance(
            RecurringTransactionResponseDto,
            recurringTransaction.toObject(),
            {
                excludeExtraneousValues: true,
            },
        );
        return successResponse(
            recurringTransactionDto,
            'Next occurrence skipped successfully',
        );
    }

    /**
     * Generate Transactions (Manual)
     * POST /api/v1/finance/recurring-transactions/:id/generate
     * Optionally accepts generateUntilDate query parameter
     */
    @Post(':id/generate')
    @HttpCode(HttpStatus.OK)
    async generate(
        @GetUser() user: any,
        @Param('id') id: string,
        @Query('generateUntilDate') generateUntilDate?: string,
    ): Promise<
        SuccessResponse<{
            generatedCount: number;
            transactions: TransactionResponseDto[];
        }>
    > {
        const generateUntil = generateUntilDate ? new Date(generateUntilDate) : undefined;
        const result = await this.financeRecurringTransactionsService.generateTransactions(
            user.userId,
            id,
            generateUntil,
        );

        const transactionsDto = result.transactions.map((transaction) =>
            plainToInstance(TransactionResponseDto, transaction.toObject(), {
                excludeExtraneousValues: true,
            }),
        );

        return successResponse(
            {
                generatedCount: result.generatedCount,
                transactions: transactionsDto,
            },
            `Successfully generated ${result.generatedCount} transaction(s)`,
        );
    }

    /**
     * Edit Future Occurrences
     * POST /api/v1/finance/recurring-transactions/:id/edit-future
     * Creates a new recurring transaction starting from next run date
     * Optionally ends the current recurring transaction
     */
    @Post(':id/edit-future')
    @HttpCode(HttpStatus.OK)
    async editFuture(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateDto: UpdateRecurringTransactionDto,
        @Query('endCurrent') endCurrent?: string,
    ): Promise<
        SuccessResponse<{
            current: RecurringTransactionResponseDto;
            new?: RecurringTransactionResponseDto;
        }>
    > {
        const shouldEndCurrent = endCurrent === 'true';
        const result = await this.financeRecurringTransactionsService.editFuture(
            user.userId,
            id,
            updateDto,
            shouldEndCurrent,
        );

        const currentDto = plainToInstance(
            RecurringTransactionResponseDto,
            result.current.toObject(),
            {
                excludeExtraneousValues: true,
            },
        );

        const newDto = result.new
            ? plainToInstance(RecurringTransactionResponseDto, result.new.toObject(), {
                excludeExtraneousValues: true,
            })
            : undefined;

        return successResponse(
            {
                current: currentDto,
                new: newDto,
            },
            'Future occurrences updated successfully',
        );
    }
}

