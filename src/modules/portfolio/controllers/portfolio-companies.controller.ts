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
import { PortfolioCompaniesService } from '../services/portfolio-companies.service';
import { CreateCompanyDto } from '../dto/companies/create-company.dto';
import { UpdateCompanyDto } from '../dto/companies/update-company.dto';
import { CompanyResponseDto } from '../dto/companies/company-response.dto';
import { BulkDeleteCompanyDto } from '../dto/companies/bulk-delete-company.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
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

@Controller('portfolio/companies')
@UseGuards(JwtAuthGuard)
export class PortfolioCompaniesController {
    constructor(private readonly portfolioCompaniesService: PortfolioCompaniesService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createCompanyDto: CreateCompanyDto,
    ): Promise<SuccessResponse<CompanyResponseDto>> {
        const company = await this.portfolioCompaniesService.create(user.userId, createCompanyDto);
        const companyDto = plainToInstance(CompanyResponseDto, company.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(companyDto, 'Company created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResponse<CompanyResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;

        const result = await this.portfolioCompaniesService.findAll(user.userId, pageNum, limitNum);
        const companies = result.companies.map((company) =>
            plainToInstance(CompanyResponseDto, company.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return paginatedResponse(
            companies,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Companies retrieved successfully',
        );
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<CompanyResponseDto>> {
        const company = await this.portfolioCompaniesService.findOne(user.userId, id);
        const companyDto = plainToInstance(CompanyResponseDto, company.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(companyDto, 'Company retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateCompanyDto: UpdateCompanyDto,
    ): Promise<SuccessResponse<CompanyResponseDto>> {
        const company = await this.portfolioCompaniesService.update(user.userId, id, updateCompanyDto);
        const companyDto = plainToInstance(CompanyResponseDto, company.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(companyDto, 'Company updated successfully');
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteCompanyDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.portfolioCompaniesService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, `Successfully deleted ${result.deletedCount} company(ies)`);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.portfolioCompaniesService.remove(user.userId, id);
        return noContentResponse();
    }
}
