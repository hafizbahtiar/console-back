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
import { PortfolioTestimonialsService } from '../services/portfolio-testimonials.service';
import { CreateTestimonialDto } from '../dto/testimonials/create-testimonial.dto';
import { UpdateTestimonialDto } from '../dto/testimonials/update-testimonial.dto';
import { TestimonialResponseDto } from '../dto/testimonials/testimonial-response.dto';
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

@Controller('portfolio/testimonials')
@UseGuards(JwtAuthGuard)
export class PortfolioTestimonialsController {
    constructor(private readonly portfolioTestimonialsService: PortfolioTestimonialsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @GetUser() user: any,
        @Body() createTestimonialDto: CreateTestimonialDto,
    ): Promise<SuccessResponse<TestimonialResponseDto>> {
        const testimonial = await this.portfolioTestimonialsService.create(user.userId, createTestimonialDto);
        const testimonialDto = plainToInstance(TestimonialResponseDto, testimonial.toObject(), {
            excludeExtraneousValues: true,
        });
        return createdResponse(testimonialDto, 'Testimonial created successfully');
    }

    @Get()
    async findAll(
        @GetUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResponse<TestimonialResponseDto>> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;

        const result = await this.portfolioTestimonialsService.findAll(user.userId, pageNum, limitNum);
        const testimonials = result.testimonials.map((testimonial) =>
            plainToInstance(TestimonialResponseDto, testimonial.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
        return paginatedResponse(
            testimonials,
            calculatePaginationMeta(result.page, result.limit, result.total),
            'Testimonials retrieved successfully',
        );
    }

    @Get(':id')
    async findOne(
        @GetUser() user: any,
        @Param('id') id: string,
    ): Promise<SuccessResponse<TestimonialResponseDto>> {
        const testimonial = await this.portfolioTestimonialsService.findOne(user.userId, id);
        const testimonialDto = plainToInstance(TestimonialResponseDto, testimonial.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(testimonialDto, 'Testimonial retrieved successfully');
    }

    @Patch(':id')
    async update(
        @GetUser() user: any,
        @Param('id') id: string,
        @Body() updateTestimonialDto: UpdateTestimonialDto,
    ): Promise<SuccessResponse<TestimonialResponseDto>> {
        const testimonial = await this.portfolioTestimonialsService.update(user.userId, id, updateTestimonialDto);
        const testimonialDto = plainToInstance(TestimonialResponseDto, testimonial.toObject(), {
            excludeExtraneousValues: true,
        });
        return successResponse(testimonialDto, 'Testimonial updated successfully');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@GetUser() user: any, @Param('id') id: string): Promise<null> {
        await this.portfolioTestimonialsService.remove(user.userId, id);
        return noContentResponse();
    }

    @Patch('reorder')
    @HttpCode(HttpStatus.NO_CONTENT)
    async reorder(
        @GetUser() user: any,
        @Body() body: { testimonialIds: string[] },
    ): Promise<null> {
        await this.portfolioTestimonialsService.reorder(user.userId, body.testimonialIds);
        return noContentResponse();
    }
}
