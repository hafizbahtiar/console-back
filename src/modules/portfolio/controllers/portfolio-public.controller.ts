import {
    Controller,
    Get,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    NotFoundException,
    UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { PortfolioProjectsService } from '../services/portfolio-projects.service';
import { PortfolioCompaniesService } from '../services/portfolio-companies.service';
import { PortfolioSkillsService } from '../services/portfolio-skills.service';
import { PortfolioExperiencesService } from '../services/portfolio-experiences.service';
import { PortfolioEducationService } from '../services/portfolio-education.service';
import { PortfolioCertificationsService } from '../services/portfolio-certifications.service';
import { PortfolioBlogService } from '../services/portfolio-blog.service';
import { PortfolioTestimonialsService } from '../services/portfolio-testimonials.service';
import { PortfolioContactsService } from '../services/portfolio-contacts.service';
import { PortfolioProfileService } from '../services/portfolio-profile.service';
import { ProjectResponseDto } from '../dto/projects/project-response.dto';
import { CompanyResponseDto } from '../dto/companies/company-response.dto';
import { SkillResponseDto } from '../dto/skills/skill-response.dto';
import { ExperienceResponseDto } from '../dto/experiences/experience-response.dto';
import { EducationResponseDto } from '../dto/education/education-response.dto';
import { CertificationResponseDto } from '../dto/certifications/certification-response.dto';
import { BlogResponseDto } from '../dto/blog/blog-response.dto';
import { TestimonialResponseDto } from '../dto/testimonials/testimonial-response.dto';
import { ContactResponseDto } from '../dto/contacts/contact-response.dto';
import { PortfolioProfileResponseDto } from '../dto/profile/portfolio-profile-response.dto';
import { plainToInstance } from 'class-transformer';

/**
 * Public read-only API for portfolio data
 * No authentication required - data is filtered by visibility settings
 */
@Controller('public/portfolio')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requests per minute for public endpoints
export class PortfolioPublicController {
    constructor(
        private readonly portfolioProjectsService: PortfolioProjectsService,
        private readonly portfolioCompaniesService: PortfolioCompaniesService,
        private readonly portfolioSkillsService: PortfolioSkillsService,
        private readonly portfolioExperiencesService: PortfolioExperiencesService,
        private readonly portfolioEducationService: PortfolioEducationService,
        private readonly portfolioCertificationsService: PortfolioCertificationsService,
        private readonly portfolioBlogService: PortfolioBlogService,
        private readonly portfolioTestimonialsService: PortfolioTestimonialsService,
        private readonly portfolioContactsService: PortfolioContactsService,
        private readonly portfolioProfileService: PortfolioProfileService,
    ) { }

    /**
     * Get public portfolio profile by username
     */
    @Get('profile/:username')
    @HttpCode(HttpStatus.OK)
    async getPublicProfile(@Param('username') username: string): Promise<PortfolioProfileResponseDto> {
        // TODO: Get user by username, then get profile
        // For now, this is a placeholder - need to add username lookup
        throw new NotFoundException('Public profile endpoint - implementation pending');
    }

    /**
     * Get public projects for a user
     */
    @Get('projects/:userId')
    @HttpCode(HttpStatus.OK)
    async getPublicProjects(
        @Param('userId') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<{ projects: ProjectResponseDto[]; total: number; page: number; limit: number }> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;

        // Get projects (service will filter by visibility if implemented)
        const result = await this.portfolioProjectsService.findAll(userId, pageNum, limitNum);

        return {
            projects: result.projects.map((project) =>
                plainToInstance(ProjectResponseDto, project.toObject(), {
                    excludeExtraneousValues: true,
                }),
            ),
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }

    /**
     * Get public companies for a user
     */
    @Get('companies/:userId')
    @HttpCode(HttpStatus.OK)
    async getPublicCompanies(@Param('userId') userId: string): Promise<CompanyResponseDto[]> {
        const result = await this.portfolioCompaniesService.findAll(userId, 1, 1000, false); // Large limit for public API
        return result.companies.map((company) =>
            plainToInstance(CompanyResponseDto, company.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
    }

    /**
     * Get public skills for a user
     */
    @Get('skills/:userId')
    @HttpCode(HttpStatus.OK)
    async getPublicSkills(@Param('userId') userId: string): Promise<SkillResponseDto[]> {
        const skills = await this.portfolioSkillsService.findAllFlat(userId);
        return skills.map((skill) =>
            plainToInstance(SkillResponseDto, skill.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
    }

    /**
     * Get public experiences for a user
     */
    @Get('experiences/:userId')
    @HttpCode(HttpStatus.OK)
    async getPublicExperiences(@Param('userId') userId: string): Promise<ExperienceResponseDto[]> {
        const result = await this.portfolioExperiencesService.findAll(userId, 1, 1000, true, false); // Large limit, populate company, exclude deleted
        return result.experiences.map((experience) =>
            plainToInstance(ExperienceResponseDto, experience.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
    }

    /**
     * Get public education for a user
     */
    @Get('education/:userId')
    @HttpCode(HttpStatus.OK)
    async getPublicEducation(@Param('userId') userId: string): Promise<EducationResponseDto[]> {
        const result = await this.portfolioEducationService.findAll(userId, 1, 1000, false); // Large limit for public API
        return result.education.map((edu) =>
            plainToInstance(EducationResponseDto, edu.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
    }

    /**
     * Get public certifications for a user
     */
    @Get('certifications/:userId')
    @HttpCode(HttpStatus.OK)
    async getPublicCertifications(@Param('userId') userId: string): Promise<CertificationResponseDto[]> {
        const result = await this.portfolioCertificationsService.findAll(userId, 1, 1000, false); // Large limit for public API
        return result.certifications.map((cert) =>
            plainToInstance(CertificationResponseDto, cert.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
    }

    /**
     * Get public blog posts for a user (published only)
     */
    @Get('blog/:userId')
    @HttpCode(HttpStatus.OK)
    async getPublicBlog(
        @Param('userId') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<{ posts: BlogResponseDto[]; total: number; page: number; limit: number }> {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;

        const result = await this.portfolioBlogService.findAll(userId, pageNum, limitNum, true); // published only

        return {
            posts: result.posts.map((post) =>
                plainToInstance(BlogResponseDto, post.toObject(), {
                    excludeExtraneousValues: true,
                }),
            ),
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }

    /**
     * Get a single public blog post by slug
     */
    @Get('blog/:userId/:slug')
    @HttpCode(HttpStatus.OK)
    async getPublicBlogPost(
        @Param('userId') userId: string,
        @Param('slug') slug: string,
    ): Promise<BlogResponseDto> {
        const post = await this.portfolioBlogService.findOne(userId, slug);
        if (!post || !post.published) {
            throw new NotFoundException('Blog post not found');
        }
        return plainToInstance(BlogResponseDto, post.toObject(), {
            excludeExtraneousValues: true,
        });
    }

    /**
     * Get public testimonials for a user
     */
    @Get('testimonials/:userId')
    @HttpCode(HttpStatus.OK)
    async getPublicTestimonials(@Param('userId') userId: string): Promise<TestimonialResponseDto[]> {
        const result = await this.portfolioTestimonialsService.findAll(userId, 1, 1000, false); // Large limit for public API
        return result.testimonials.map((testimonial) =>
            plainToInstance(TestimonialResponseDto, testimonial.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
    }

    /**
     * Get public contacts/social links for a user (active only)
     */
    @Get('contacts/:userId')
    @HttpCode(HttpStatus.OK)
    async getPublicContacts(@Param('userId') userId: string): Promise<ContactResponseDto[]> {
        const result = await this.portfolioContactsService.findAll(userId, 1, 1000, true, false); // active only, exclude deleted, large limit
        return result.contacts.map((contact) =>
            plainToInstance(ContactResponseDto, contact.toObject(), {
                excludeExtraneousValues: true,
            }),
        );
    }
}

