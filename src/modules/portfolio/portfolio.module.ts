import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';

// Schemas
import { Project, ProjectSchema } from './schemas/portfolio-project.schema';
import { Company, CompanySchema } from './schemas/portfolio-company.schema';
import { Skill, SkillSchema } from './schemas/portfolio-skill.schema';
import { Experience, ExperienceSchema } from './schemas/portfolio-experience.schema';
import { Education, EducationSchema } from './schemas/portfolio-education.schema';
import { Certification, CertificationSchema } from './schemas/portfolio-certification.schema';
import { Blog, BlogSchema } from './schemas/portfolio-blog.schema';
import { Testimonial, TestimonialSchema } from './schemas/portfolio-testimonial.schema';
import { Contact, ContactSchema } from './schemas/portfolio-contact.schema';
import { PortfolioProfile, PortfolioProfileSchema } from './schemas/portfolio-profile.schema';

// Controllers
import { PortfolioProjectsController } from './controllers/portfolio-projects.controller';
import { PortfolioCompaniesController } from './controllers/portfolio-companies.controller';
import { PortfolioSkillsController } from './controllers/portfolio-skills.controller';
import { PortfolioExperiencesController } from './controllers/portfolio-experiences.controller';
import { PortfolioEducationController } from './controllers/portfolio-education.controller';
import { PortfolioCertificationsController } from './controllers/portfolio-certifications.controller';
import { PortfolioBlogController } from './controllers/portfolio-blog.controller';
import { PortfolioTestimonialsController } from './controllers/portfolio-testimonials.controller';
import { PortfolioContactsController } from './controllers/portfolio-contacts.controller';
import { PortfolioProfileController } from './controllers/portfolio-profile.controller';
import { PortfolioPublicController } from './controllers/portfolio-public.controller';

// Services
import { PortfolioProjectsService } from './services/portfolio-projects.service';
import { PortfolioCompaniesService } from './services/portfolio-companies.service';
import { PortfolioSkillsService } from './services/portfolio-skills.service';
import { PortfolioExperiencesService } from './services/portfolio-experiences.service';
import { PortfolioEducationService } from './services/portfolio-education.service';
import { PortfolioCertificationsService } from './services/portfolio-certifications.service';
import { PortfolioBlogService } from './services/portfolio-blog.service';
import { PortfolioTestimonialsService } from './services/portfolio-testimonials.service';
import { PortfolioContactsService } from './services/portfolio-contacts.service';
import { PortfolioProfileService } from './services/portfolio-profile.service';

// Auth Module (for JWT guards)
import { AuthModule } from '../auth/auth.module';
// Users Module (for username lookup in public API)
import { UsersModule } from '../users/users.module';
// Upload Module (for file uploads)
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
            { name: Company.name, schema: CompanySchema },
            { name: Skill.name, schema: SkillSchema },
            { name: Experience.name, schema: ExperienceSchema },
            { name: Education.name, schema: EducationSchema },
            { name: Certification.name, schema: CertificationSchema },
            { name: Blog.name, schema: BlogSchema },
            { name: Testimonial.name, schema: TestimonialSchema },
            { name: Contact.name, schema: ContactSchema },
            { name: PortfolioProfile.name, schema: PortfolioProfileSchema },
        ]),
        PassportModule,
        AuthModule,
        UploadModule, // For file uploads (avatar, resume)
        forwardRef(() => UsersModule), // For username lookup in public API (forwardRef to avoid circular dependency)
        // ThrottlerModule is needed for PortfolioPublicController which uses ThrottlerGuard
        // This ensures ThrottlerModule is available whenever PortfolioModule is loaded
        ThrottlerModule.forRoot([
            {
                ttl: 60000, // 1 minute
                limit: 10, // 10 requests per minute (default)
            },
        ]),
    ],
    controllers: [
        PortfolioProjectsController,
        PortfolioCompaniesController,
        PortfolioSkillsController,
        PortfolioExperiencesController,
        PortfolioEducationController,
        PortfolioCertificationsController,
        PortfolioBlogController,
        PortfolioTestimonialsController,
        PortfolioContactsController,
        PortfolioProfileController,
        PortfolioPublicController,
    ],
    providers: [
        PortfolioProjectsService,
        PortfolioCompaniesService,
        PortfolioSkillsService,
        PortfolioExperiencesService,
        PortfolioEducationService,
        PortfolioCertificationsService,
        PortfolioBlogService,
        PortfolioTestimonialsService,
        PortfolioContactsService,
        PortfolioProfileService,
    ],
    exports: [
        PortfolioProjectsService,
        PortfolioCompaniesService,
        PortfolioSkillsService,
        PortfolioExperiencesService,
        PortfolioEducationService,
        PortfolioCertificationsService,
        PortfolioBlogService,
        PortfolioTestimonialsService,
        PortfolioContactsService,
        PortfolioProfileService,
    ],
})
export class PortfolioModule { }

