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
import { PortfolioProjectsService } from '../services/portfolio-projects.service';
import { CreateProjectDto } from '../dto/projects/create-project.dto';
import { UpdateProjectDto } from '../dto/projects/update-project.dto';
import { ProjectResponseDto } from '../dto/projects/project-response.dto';
import { BulkDeleteProjectDto } from '../dto/projects/bulk-delete-project.dto';
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

@Controller('portfolio/projects')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for portfolio endpoints
export class PortfolioProjectsController {
    constructor(private readonly portfolioProjectsService: PortfolioProjectsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createProjectDto: CreateProjectDto,
    ): Promise<SuccessResponse<ProjectResponseDto>> {
        const project = await this.portfolioProjectsService.create(user.userId, createProjectDto);
        const projectDto = plainToInstance(ProjectResponseDto, project.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(projectDto, 'Project created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResponse<ProjectResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;

        const result = await this.portfolioProjectsService.findAll(user.userId, pageNum, limitNum);

        const projects = result.projects.map((project) =>
            plainToInstance(ProjectResponseDto, project.toObject(), {
                excludeExtraneousValues: true,
            }),
        );

        return paginatedResponse(
            projects,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Projects retrieved successfully',
        );
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<ProjectResponseDto>> {
        const project = await this.portfolioProjectsService.findOne(user.userId, id);
        const projectDto = plainToInstance(ProjectResponseDto, project.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(projectDto, 'Project retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateProjectDto: UpdateProjectDto,
    ): Promise<SuccessResponse<ProjectResponseDto>> {
        const project = await this.portfolioProjectsService.update(user.userId, id, updateProjectDto);
        const projectDto = plainToInstance(ProjectResponseDto, project.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(projectDto, 'Project updated successfully');
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteProjectDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.portfolioProjectsService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, `Successfully deleted ${result.deletedCount} project(s)`);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.portfolioProjectsService.remove(user.userId, id);
        return noContentResponse();
    }

    @Patch('reorder')
    @HttpCode(HttpStatus.NO_CONTENT)
    async reorder(
        @GetUser() user: any,
        @Body() body: { projectIds: string[] },
    ): Promise<null> {
        await this.portfolioProjectsService.reorder(user.userId, body.projectIds);
        return noContentResponse();
    }
}
