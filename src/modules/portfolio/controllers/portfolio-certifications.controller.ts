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
import { PortfolioCertificationsService } from '../services/portfolio-certifications.service';
import { CreateCertificationDto } from '../dto/certifications/create-certification.dto';
import { UpdateCertificationDto } from '../dto/certifications/update-certification.dto';
import { CertificationResponseDto } from '../dto/certifications/certification-response.dto';
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

@Controller('portfolio/certifications')
@UseGuards(JwtAuthGuard)
export class PortfolioCertificationsController {
    constructor(private readonly portfolioCertificationsService: PortfolioCertificationsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createCertificationDto: CreateCertificationDto,
    ): Promise<SuccessResponse<CertificationResponseDto>> {
        const certification = await this.portfolioCertificationsService.create(user.userId, createCertificationDto);
        const certificationDto = plainToInstance(CertificationResponseDto, certification.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(certificationDto, 'Certification created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResponse<CertificationResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;

        const result = await this.portfolioCertificationsService.findAll(user.userId, pageNum, limitNum);
        const certifications = result.certifications.map((certification) =>
            plainToInstance(CertificationResponseDto, certification.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return paginatedResponse(
            certifications,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Certifications retrieved successfully',
        );
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<CertificationResponseDto>> {
        const certification = await this.portfolioCertificationsService.findOne(user.userId, id);
        const certificationDto = plainToInstance(CertificationResponseDto, certification.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(certificationDto, 'Certification retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateCertificationDto: UpdateCertificationDto,
    ): Promise<SuccessResponse<CertificationResponseDto>> {
        const certification = await this.portfolioCertificationsService.update(user.userId, id, updateCertificationDto);
        const certificationDto = plainToInstance(CertificationResponseDto, certification.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(certificationDto, 'Certification updated successfully');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.portfolioCertificationsService.remove(user.userId, id);
        return noContentResponse();
    }
}
