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
import { PortfolioExperiencesService } from '../services/portfolio-experiences.service';
import { CreateExperienceDto } from '../dto/experiences/create-experience.dto';
import { UpdateExperienceDto } from '../dto/experiences/update-experience.dto';
import { ExperienceResponseDto } from '../dto/experiences/experience-response.dto';
import { BulkDeleteExperienceDto } from '../dto/experiences/bulk-delete-experience.dto';
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

@Controller('portfolio/experiences')
@UseGuards(JwtAuthGuard)
export class PortfolioExperiencesController {
    constructor(private readonly portfolioExperiencesService: PortfolioExperiencesService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createExperienceDto: CreateExperienceDto,
    ): Promise<SuccessResponse<ExperienceResponseDto>> {
        const experience = await this.portfolioExperiencesService.create(user.userId, createExperienceDto);
        const experienceDto = plainToInstance(ExperienceResponseDto, experience.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(experienceDto, 'Experience created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResponse<ExperienceResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;

        const result = await this.portfolioExperiencesService.findAll(user.userId, pageNum, limitNum);
        const experiences = result.experiences.map((experience) =>
            plainToInstance(ExperienceResponseDto, experience.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return paginatedResponse(
            experiences,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Experiences retrieved successfully',
        );
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<ExperienceResponseDto>> {
        const experience = await this.portfolioExperiencesService.findOne(user.userId, id);
        const experienceDto = plainToInstance(ExperienceResponseDto, experience.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(experienceDto, 'Experience retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateExperienceDto: UpdateExperienceDto,
    ): Promise<SuccessResponse<ExperienceResponseDto>> {
        const experience = await this.portfolioExperiencesService.update(user.userId, id, updateExperienceDto);
        const experienceDto = plainToInstance(ExperienceResponseDto, experience.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(experienceDto, 'Experience updated successfully');
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteExperienceDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.portfolioExperiencesService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, `Successfully deleted ${result.deletedCount} experience(s)`);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.portfolioExperiencesService.remove(user.userId, id);
        return noContentResponse();
    }
}
