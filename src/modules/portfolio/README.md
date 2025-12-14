# Portfolio Module

## Overview

The Portfolio Module provides comprehensive portfolio management functionality for the Console application. It allows users to create, manage, and display professional portfolios with various content types including projects, experiences, education, skills, and more. The module supports both private management and public display of portfolio content with granular privacy controls.

## Features

### 1. Portfolio Content Management
- **Projects**: Showcase work projects with descriptions, technologies, and media
- **Experience**: Professional work history with company details and achievements
- **Education**: Academic background and qualifications
- **Skills**: Technical and soft skills with categorization
- **Certifications**: Professional certifications and achievements
- **Blog**: Personal blog posts with publishing controls
- **Testimonials**: Client and colleague testimonials
- **Companies**: Company profiles and affiliations
- **Contacts**: Social links and contact information

### 2. Portfolio Profile Management
- **User Profile**: Central portfolio profile with bio, location, and availability
- **Media Management**: Avatar and resume upload with image processing
- **Privacy Controls**: Granular control over portfolio visibility
- **Theme Configuration**: Customizable portfolio themes
- **Content Visibility**: Toggle visibility of different portfolio sections

### 3. Public Portfolio API
- **Read-Only Access**: Public endpoints for portfolio viewing
- **Username-based Access**: Portfolio access via username
- **Content Filtering**: Automatic filtering based on privacy settings
- **SEO-friendly**: Clean URLs for portfolio sections
- **Rate Limiting**: Protected against abuse with throttling

### 4. File Upload & Media
- **Avatar Upload**: Image upload with automatic resizing and optimization
- **Resume Upload**: Document upload for resume files
- **Bulk Operations**: Efficient bulk delete operations for content management
- **Media Processing**: Automatic image processing and optimization

## Module Structure

```
src/modules/portfolio/
├── portfolio.module.ts              # Main module configuration
├── controllers/                     # API endpoints
│   ├── portfolio-profile.controller.ts    # Profile management
│   ├── portfolio-projects.controller.ts   # Project management
│   ├── portfolio-experiences.controller.ts # Experience management
│   ├── portfolio-education.controller.ts   # Education management
│   ├── portfolio-skills.controller.ts     # Skills management
│   ├── portfolio-certifications.controller.ts # Certifications
│   ├── portfolio-blog.controller.ts       # Blog management
│   ├── portfolio-testimonials.controller.ts # Testimonials
│   ├── portfolio-companies.controller.ts  # Company management
│   ├── portfolio-contacts.controller.ts   # Contact management
│   └── portfolio-public.controller.ts     # Public API
├── services/                        # Business logic
│   ├── portfolio-profile.service.ts
│   ├── portfolio-projects.service.ts
│   ├── portfolio-experiences.service.ts
│   ├── portfolio-education.service.ts
│   ├── portfolio-skills.service.ts
│   ├── portfolio-certifications.service.ts
│   ├── portfolio-blog.service.ts
│   ├── portfolio-testimonials.service.ts
│   ├── portfolio-companies.service.ts
│   └── portfolio-contacts.service.ts
├── schemas/                         # Database schemas
│   ├── portfolio-profile.schema.ts
│   ├── portfolio-project.schema.ts
│   ├── portfolio-experience.schema.ts
│   ├── portfolio-education.schema.ts
│   ├── portfolio-skill.schema.ts
│   ├── portfolio-certification.schema.ts
│   ├── portfolio-blog.schema.ts
│   ├── portfolio-testimonial.schema.ts
│   ├── portfolio-company.schema.ts
│   └── portfolio-contact.schema.ts
├── dto/                             # Data Transfer Objects
│   ├── profile/
│   │   ├── portfolio-profile-response.dto.ts
│   │   └── update-portfolio-profile.dto.ts
│   ├── projects/
│   │   ├── bulk-delete-project.dto.ts
│   │   ├── create-project.dto.ts
│   │   ├── project-response.dto.ts
│   │   └── update-project.dto.ts
│   ├── experiences/
│   │   ├── bulk-delete-experience.dto.ts
│   │   ├── create-experience.dto.ts
│   │   ├── experience-response.dto.ts
│   │   └── update-experience.dto.ts
│   ├── education/
│   │   ├── bulk-delete-education.dto.ts
│   │   ├── create-education.dto.ts
│   │   ├── education-response.dto.ts
│   │   └── update-education.dto.ts
│   ├── skills/
│   │   ├── bulk-delete-skill.dto.ts
│   │   ├── create-skill.dto.ts
│   │   ├── skill-response.dto.ts
│   │   └── update-skill.dto.ts
│   ├── certifications/
│   │   ├── bulk-delete-certification.dto.ts
│   │   ├── certification-response.dto.ts
│   │   ├── create-certification.dto.ts
│   │   └── update-certification.dto.ts
│   ├── blog/
│   │   ├── bulk-delete-blog.dto.ts
│   │   ├── blog-response.dto.ts
│   │   ├── create-blog.dto.ts
│   │   └── update-blog.dto.ts
│   ├── testimonials/
│   │   ├── bulk-delete-testimonial.dto.ts
│   │   ├── create-testimonial.dto.ts
│   │   ├── testimonial-response.dto.ts
│   │   └── update-testimonial.dto.ts
│   ├── companies/
│   │   ├── bulk-delete-company.dto.ts
│   │   ├── company-response.dto.ts
│   │   ├── create-company.dto.ts
│   │   └── update-company.dto.ts
│   └── contacts/
│       ├── bulk-delete-contact.dto.ts
│       ├── contact-response.dto.ts
│       ├── create-contact.dto.ts
│       └── update-contact.dto.ts
├── util/                            # Utility functions
│   ├── portfolio-common.util.ts
│   ├── portfolio-profile.util.ts
│   ├── portfolio-projects.util.ts
│   ├── portfolio-experiences.util.ts
│   ├── portfolio-education.util.ts
│   ├── portfolio-skills.util.ts
│   ├── portfolio-certifications.util.ts
│   ├── portfolio-blog.util.ts
│   ├── portfolio-testimonials.util.ts
│   ├── portfolio-companies.util.ts
│   ├── portfolio-contacts.util.ts
│   └── bulk-operations.util.ts
└── README.md                        # This documentation
```

## Key Components

### PortfolioProfile
Central profile entity with the following properties:
- `userId`: Reference to user (unique)
- `bio`: Professional biography
- `avatar`: Profile image URL
- `resumeUrl`: Resume file URL
- `location`: Geographic location
- `availableForHire`: Job availability status
- `portfolioUrl`: External portfolio link
- `theme`: UI theme preference
- `isPublic`: Portfolio visibility setting
- `show*`: Individual section visibility toggles

### Controllers

#### Private Controllers (JWT Auth Required)
- **PortfolioProfileController**: Profile CRUD operations and media uploads
- **PortfolioProjectsController**: Project management
- **PortfolioExperiencesController**: Experience management
- **PortfolioEducationController**: Education management
- **PortfolioSkillsController**: Skills management
- **PortfolioCertificationsController**: Certification management
- **PortfolioBlogController**: Blog post management
- **PortfolioTestimonialsController**: Testimonial management
- **PortfolioCompaniesController**: Company management
- **PortfolioContactsController**: Contact management

#### Public Controller (No Auth Required)
- **PortfolioPublicController**: Read-only public API access

### Services
Each content type has its own service with standard CRUD operations:
- `findAll()`: Get all items with pagination
- `findById()`: Get specific item by ID
- `create()`: Create new item
- `update()`: Update existing item
- `delete()`: Soft delete item
- `findAllFlat()`: Get all items without pagination (for public API)

## API Endpoints

### Private Endpoints (JWT Auth Required)

#### Profile Management
```
GET    /portfolio/profile              # Get user profile
PATCH  /portfolio/profile              # Update profile
POST   /portfolio/profile/avatar       # Upload avatar
POST   /portfolio/profile/resume       # Upload resume
```

#### Projects
```
GET    /portfolio/projects             # Get user projects
POST   /portfolio/projects             # Create project
GET    /portfolio/projects/:id         # Get specific project
PATCH  /portfolio/projects/:id         # Update project
DELETE /portfolio/projects/:id         # Delete project
POST   /portfolio/projects/bulk-delete # Bulk delete projects
```

#### Other Content Types
Similar endpoints exist for experiences, education, skills, certifications, blog, testimonials, companies, and contacts.

### Public Endpoints (No Auth Required)

```
GET    /public/portfolio/profile/:username           # Get public profile
GET    /public/portfolio/projects/:userId             # Get public projects
GET    /public/portfolio/companies/:userId            # Get public companies
GET    /public/portfolio/skills/:userId               # Get public skills
GET    /public/portfolio/experiences/:userId          # Get public experiences
GET    /public/portfolio/education/:userId            # Get public education
GET    /public/portfolio/certifications/:userId       # Get public certifications
GET    /public/portfolio/blog/:userId                 # Get public blog posts
GET    /public/portfolio/blog/:userId/:slug           # Get specific blog post
GET    /public/portfolio/testimonials/:userId         # Get public testimonials
GET    /public/portfolio/contacts/:userId             # Get public contacts
```

## Authentication & Authorization

- **Private Endpoints**: Require JWT authentication via `JwtAuthGuard`
- **Public Endpoints**: No authentication required, but rate-limited (60 requests/minute)
- **User Isolation**: Users can only manage their own portfolio content
- **Public Access**: Portfolio content is accessible via username lookup

## Database Schema

### Core Schemas
- **PortfolioProfile**: User's main portfolio profile
- **Project**: Work projects with technologies and descriptions
- **Experience**: Professional work experience
- **Education**: Academic background
- **Skill**: Technical and soft skills
- **Certification**: Professional certifications
- **Blog**: Blog posts with publishing status
- **Testimonial**: Client/colleague testimonials
- **Company**: Company profiles and affiliations
- **Contact**: Social links and contact information

### Common Features
- All schemas support soft deletion
- Timestamps for creation and updates
- Proper indexing for performance
- References to other entities where applicable

## File Upload & Media

### Avatar Upload
- Automatic image resizing (400x400px)
- Image optimization (90% quality)
- File type validation
- Size limits configured via upload settings

### Resume Upload
- Document file upload support
- URL-based resume linking
- File validation and security

## Rate Limiting

- **Private Endpoints**: Standard throttling (configurable)
- **Public Endpoints**: 60 requests per minute to prevent abuse
- **Admin Endpoints**: Higher limits for internal tools

## Usage Examples

### Create a Project
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "E-commerce Platform",
       "description": "Full-stack e-commerce solution",
       "technologies": ["React", "Node.js", "MongoDB"],
       "url": "https://example.com",
       "githubUrl": "https://github.com/example"
     }' \
     http://localhost:3000/api/v1/portfolio/projects
```

### Get Public Portfolio
```bash
curl http://localhost:3000/api/v1/public/portfolio/profile/username
```

### Update Profile
```bash
curl -X PATCH \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "bio": "Full-stack developer with 5+ years experience",
       "location": "San Francisco, CA",
       "availableForHire": true
     }' \
     http://localhost:3000/api/v1/portfolio/profile
```

### Upload Avatar
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@/path/to/avatar.jpg" \
     http://localhost:3000/api/v1/portfolio/profile/avatar
```

## Development Notes

- Module uses Mongoose for database operations
- All entities support soft deletion
- Comprehensive DTO validation for all inputs
- Proper error handling and logging
- Image processing via configured upload service
- Forward reference to UsersModule for username lookup
- ThrottlerModule configured for public API protection

## Security Considerations

- JWT authentication for all private endpoints
- Input validation and sanitization
- File upload security and validation
- User data isolation (users can't access others' data)
- Rate limiting to prevent abuse
- Proper error handling to avoid information leakage

## Future Enhancements

- Portfolio templates and themes
- Advanced search and filtering
- Portfolio analytics and statistics
- Multi-language support
- Import/export functionality
- Integration with external portfolio platforms
- Advanced media management (galleries, videos)
- Portfolio sharing and collaboration features
- SEO optimization tools
- Advanced privacy controls
- Portfolio versioning and history
