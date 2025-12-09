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
import { PortfolioBlogService } from '../services/portfolio-blog.service';
import { CreateBlogDto } from '../dto/blog/create-blog.dto';
import { UpdateBlogDto } from '../dto/blog/update-blog.dto';
import { BlogResponseDto } from '../dto/blog/blog-response.dto';
import { BulkDeleteBlogDto } from '../dto/blog/bulk-delete-blog.dto';
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

@Controller('portfolio/blog')
@UseGuards(JwtAuthGuard)
export class PortfolioBlogController {
    constructor(private readonly portfolioBlogService: PortfolioBlogService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createBlogDto: CreateBlogDto,
    ): Promise<SuccessResponse<BlogResponseDto>> {
        const blog = await this.portfolioBlogService.create(user.userId, createBlogDto);
        const blogDto = plainToInstance(BlogResponseDto, blog.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(blogDto, 'Blog post created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('published') published?: string,
    ): Promise<PaginatedResponse<BlogResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const publishedBool = published !== undefined ? published === 'true' : undefined;

        const result = await this.portfolioBlogService.findAll(user.userId, pageNum, limitNum, publishedBool);
        const posts = result.posts.map((post) =>
            plainToInstance(BlogResponseDto, post.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return paginatedResponse(
            posts,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Blog posts retrieved successfully',
        );
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<BlogResponseDto>> {
        const blog = await this.portfolioBlogService.findOne(user.userId, id);
        const blogDto = plainToInstance(BlogResponseDto, blog.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(blogDto, 'Blog post retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateBlogDto: UpdateBlogDto,
    ): Promise<SuccessResponse<BlogResponseDto>> {
        const blog = await this.portfolioBlogService.update(user.userId, id, updateBlogDto);
        const blogDto = plainToInstance(BlogResponseDto, blog.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(blogDto, 'Blog post updated successfully');
    }

    @Post('bulk-delete')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @GetUser() user: any,
        @Body() bulkDeleteDto: BulkDeleteBlogDto,
    ): Promise<SuccessResponse<{ deletedCount: number; failedIds: string[] }>> {
        const result = await this.portfolioBlogService.bulkDelete(user.userId, bulkDeleteDto.ids);
        return successResponse(result, `Successfully deleted ${result.deletedCount} blog post(s)`);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.portfolioBlogService.remove(user.userId, id);
        return noContentResponse();
    }

    @Patch(':id/publish')
    async publish(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() body: { published: boolean },
    ): Promise<SuccessResponse<BlogResponseDto>> {
        const blog = await this.portfolioBlogService.publish(user.userId, id, body.published);
        const blogDto = plainToInstance(BlogResponseDto, blog.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(blogDto, `Blog post ${body.published ? 'published' : 'unpublished'} successfully`);
    }
}
