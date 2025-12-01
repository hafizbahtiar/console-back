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
import { PortfolioEducationService } from '../services/portfolio-education.service';
import { CreateEducationDto } from '../dto/education/create-education.dto';
import { UpdateEducationDto } from '../dto/education/update-education.dto';
import { EducationResponseDto } from '../dto/education/education-response.dto';
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

@Controller('portfolio/education')
@UseGuards(JwtAuthGuard)
export class PortfolioEducationController {
    constructor(private readonly portfolioEducationService: PortfolioEducationService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createEducationDto: CreateEducationDto,
    ): Promise<SuccessResponse<EducationResponseDto>> {
        const education = await this.portfolioEducationService.create(user.userId, createEducationDto);
        const educationDto = plainToInstance(EducationResponseDto, education.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(educationDto, 'Education entry created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResponse<EducationResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;

        const result = await this.portfolioEducationService.findAll(user.userId, pageNum, limitNum);
        const education = result.education.map((edu) =>
            plainToInstance(EducationResponseDto, edu.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return paginatedResponse(
            education,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Education entries retrieved successfully',
        );
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<EducationResponseDto>> {
        const education = await this.portfolioEducationService.findOne(user.userId, id);
        const educationDto = plainToInstance(EducationResponseDto, education.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(educationDto, 'Education entry retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateEducationDto: UpdateEducationDto,
    ): Promise<SuccessResponse<EducationResponseDto>> {
        const education = await this.portfolioEducationService.update(user.userId, id, updateEducationDto);
        const educationDto = plainToInstance(EducationResponseDto, education.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(educationDto, 'Education entry updated successfully');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.portfolioEducationService.remove(user.userId, id);
        return noContentResponse();
    }
}
