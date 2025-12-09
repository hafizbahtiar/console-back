import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OwnerOnlyGuard } from '../../auth/guards/owner-only.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import {
    successResponse,
    createdResponse,
    noContentResponse,
} from '../../../common/responses/response.util';
import { SuccessResponse } from '../../../common/responses/response.interface';
import { FinanceTransactionTemplatesService, TransactionTemplateFilters } from '../services/finance-transaction-templates.service';
import { CreateTransactionTemplateDto } from '../dto/transaction-templates/create-transaction-template.dto';
import { UpdateTransactionTemplateDto } from '../dto/transaction-templates/update-transaction-template.dto';
import { BulkDeleteTransactionTemplateDto } from '../dto/transaction-templates/bulk-delete-transaction-template.dto';
import { TransactionTemplateResponseDto } from '../dto/transaction-templates/transaction-template-response.dto';
import { plainToInstance } from 'class-transformer';
import { TransactionType } from '../schemas/finance-transaction.schema';

/**
 * Transaction Templates Controller
 * 
 * Owner-only endpoints for managing transaction templates.
 * Templates allow users to save common transactions for quick reuse.
 */
@Controller('finance/transaction-templates')
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
export class FinanceTransactionTemplatesController {
    constructor(
        private readonly transactionTemplatesService: FinanceTransactionTemplatesService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createTemplateDto: CreateTransactionTemplateDto,
    ): Promise<SuccessResponse<TransactionTemplateResponseDto>> {
        const template = await this.transactionTemplatesService.create(user.userId, createTemplateDto);
        const templateDto = plainToInstance(TransactionTemplateResponseDto, template.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(templateDto, 'Transaction template created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('type') type?: TransactionType,
        @Query('category') category?: string,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: 'usageCount' | 'name' | 'createdAt' | 'updatedAt',
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ): Promise<SuccessResponse<TransactionTemplateResponseDto[]>> {
        const filters: TransactionTemplateFilters = {
            type,
            category,
            search,
            sortBy,
            sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        };

        const templates = await this.transactionTemplatesService.findAll(user.userId, filters);
        const templatesDto = templates.map((template) =>
            plainToInstance(TransactionTemplateResponseDto, template.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return successResponse(templatesDto, 'Transaction templates retrieved successfully');
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<TransactionTemplateResponseDto>> {
        const template = await this.transactionTemplatesService.findOne(user.userId, id);
        const templateDto = plainToInstance(TransactionTemplateResponseDto, template.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(templateDto, 'Transaction template retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateTemplateDto: UpdateTransactionTemplateDto,
    ): Promise<SuccessResponse<TransactionTemplateResponseDto>> {
        const template = await this.transactionTemplatesService.update(user.userId, id, updateTemplateDto);
        const templateDto = plainToInstance(TransactionTemplateResponseDto, template.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(templateDto, 'Transaction template updated successfully');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @GetUser() user: any,
        @Param('id') id: string,
    ) {
        await this.transactionTemplatesService.remove(user.userId, id);
        return noContentResponse();
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteTransactionTemplateDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.transactionTemplatesService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, 'Transaction templates deleted successfully');
    }

    @Post(':id/increment-usage')
    @HttpCode(HttpStatus.OK)
    async incrementUsage(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<TransactionTemplateResponseDto>> {
        const template = await this.transactionTemplatesService.incrementUsage(user.userId, id);
        const templateDto = plainToInstance(TransactionTemplateResponseDto, template.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(templateDto, 'Template usage incremented successfully');
    }
}

