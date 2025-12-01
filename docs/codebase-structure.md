# Codebase Structure

This document provides a comprehensive overview of the Console Backend codebase structure, architecture, and organization.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Module Organization](#module-organization)
- [Common Components](#common-components)
- [Configuration](#configuration)
- [Process Types](#process-types)
- [Key Patterns](#key-patterns)

## Architecture Overview

Console Backend is built with **NestJS** and follows a modular architecture with the following key characteristics:

- **Multi-Process Architecture**: Supports API, Worker, and Scheduler processes via PM2
- **Modular Design**: Feature-based modules with clear separation of concerns
- **Queue System**: Bull queues with Redis for background job processing
- **Real-time Communication**: WebSocket support via Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for caching and queue storage
- **Security**: JWT authentication, rate limiting, CORS, Helmet

## Directory Structure

```
src/
├── main.ts                    # API server entry point
├── worker.main.ts             # Worker process entry point
├── scheduler.main.ts           # Scheduler process entry point
├── app.module.ts              # Root application module
├── app.controller.ts          # Root controller
├── app.service.ts             # Root service
│
├── config/                    # Configuration files
│   ├── config.interface.ts    # TypeScript config interface
│   ├── configuration.ts       # Config factory
│   ├── env.validation.ts      # Environment variable validation
│   └── helmet.config.ts       # Helmet security config
│
├── database/                  # Database module
│   └── database.module.ts    # MongoDB connection setup
│
├── common/                    # Shared/common components
│   ├── common.module.ts      # Common module
│   ├── filters/              # Exception filters
│   │   └── http-exception.filter.ts
│   ├── guards/               # Custom guards
│   │   └── ownership.guard.ts
│   ├── interceptors/         # Request/response interceptors
│   │   ├── logging.interceptor.ts
│   │   └── transform-response.interceptor.ts
│   ├── responses/            # Response utilities
│   │   ├── response.interface.ts
│   │   ├── response.util.ts
│   │   └── index.ts
│   ├── services/             # Shared services
│   │   └── location.service.ts
│   ├── storage/             # Storage adapters
│   │   └── throttler-redis.storage.ts
│   └── utils/               # Utility functions
│       ├── csv.util.ts
│       ├── password.util.ts
│       └── user-agent.util.ts
│
├── modules/                  # Feature modules
│   ├── accounts/            # Account management
│   ├── admin/               # Admin features
│   ├── auth/                # Authentication & authorization
│   ├── email/               # Email service & preferences
│   ├── notifications/       # Notification preferences
│   ├── portfolio/           # Portfolio management
│   ├── queue/               # Queue system
│   ├── redis/               # Redis service
│   ├── scheduler/            # Scheduled jobs
│   ├── sessions/            # Session management
│   ├── settings/            # User settings
│   ├── upload/              # File upload
│   ├── users/               # User management
│   └── websocket/           # WebSocket gateway
│
└── utils/                   # Utility functions
    └── process-type.util.ts  # Process type detection
```

## Module Organization

Each feature module follows a consistent structure:

```
modules/{feature}/
├── {feature}.module.ts       # Module definition
├── {feature}.controller.ts   # HTTP controllers (optional)
├── {feature}.service.ts      # Business logic (optional)
├── dto/                      # Data Transfer Objects
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── {entity}-response.dto.ts
├── schemas/                  # Mongoose schemas
│   └── {entity}.schema.ts
├── controllers/              # Controllers (if multiple)
├── services/                 # Services (if multiple)
├── guards/                   # Feature-specific guards
├── decorators/               # Custom decorators
└── interfaces/               # TypeScript interfaces
```

### Core Modules

#### 1. **Auth Module** (`modules/auth/`)

- JWT-based authentication
- Registration, login, password reset
- Session management
- Guards: `JwtAuthGuard`, `JwtRefreshGuard`
- Strategies: JWT, JWT Refresh

#### 2. **Users Module** (`modules/users/`)

- User profile management
- User CRUD operations
- Avatar upload

#### 3. **Accounts Module** (`modules/accounts/`)

- Account management (email/password)
- Email verification
- Password reset tokens
- Account deletion

#### 4. **Portfolio Module** (`modules/portfolio/`)

- Complete portfolio management system
- Entities: Projects, Companies, Skills, Experiences, Education, Certifications, Blog, Testimonials, Contacts, Profile
- Public API for portfolio viewing
- Ownership validation

#### 5. **Email Module** (`modules/email/`)

- Email service with queue integration
- Email templates
- Email preferences management
- Template rendering

#### 6. **Queue Module** (`modules/queue/`)

- Bull queue configuration
- Email queue processing
- Queue monitoring

#### 7. **Sessions Module** (`modules/sessions/`)

- Session tracking
- Active session management
- Session cleanup (scheduled)

#### 8. **Settings Module** (`modules/settings/`)

- User preferences
- Account settings
- Settings management

#### 9. **Notifications Module** (`modules/notifications/`)

- Notification preferences
- Email, in-app, and push notification settings

#### 10. **Upload Module** (`modules/upload/`)

- File upload handling
- Image optimization (Sharp)
- Document upload
- File validation

#### 11. **WebSocket Module** (`modules/websocket/`)

- Real-time communication
- Socket.IO gateway
- WebSocket guards and filters

#### 12. **Admin Module** (`modules/admin/`)

- Admin dashboard
- Queue monitoring (Bull Board)
- System metrics
- Cron job tracking

#### 13. **Redis Module** (`modules/redis/`)

- Redis client management
- Redis health checks
- Global Redis service

#### 14. **Scheduler Module** (`modules/scheduler/`)

- Cron job management
- Scheduled tasks
- Job tracking

## Common Components

### Filters (`common/filters/`)

- **HttpExceptionFilter**: Global exception filter
  - Handles all HTTP exceptions
  - Formats error responses consistently
  - Handles validation errors, MongoDB errors
  - Environment-aware error messages

### Guards (`common/guards/`)

- **OwnershipGuard**: Validates resource ownership
  - Ensures users can only access their own resources

### Interceptors (`common/interceptors/`)

- **LoggingInterceptor**: Request/response logging
  - Logs incoming requests and outgoing responses
  - Development mode only (configurable)

- **TransformResponseInterceptor**: Response transformation
  - Wraps responses in standard format
  - Ensures consistent API responses

### Response Utilities (`common/responses/`)

- **Response Interfaces**: TypeScript interfaces for responses
  - `SuccessResponse<T>`
  - `PaginatedResponse<T>`
  - `ErrorResponse`

- **Response Utilities**: Helper functions
  - `successResponse()`
  - `paginatedResponse()`
  - `errorResponse()`

### Storage (`common/storage/`)

- **ThrottlerRedisStorage**: Redis storage adapter for rate limiting
  - Implements `ThrottlerStorage` interface
  - Falls back to memory if Redis unavailable

### Utilities (`common/utils/`)

- **password.util.ts**: Password hashing/verification (Argon2)
- **user-agent.util.ts**: User agent parsing
- **csv.util.ts**: CSV export utilities

## Configuration

### Configuration Files (`config/`)

- **config.interface.ts**: TypeScript interface for configuration
- **configuration.ts**: Configuration factory function
- **env.validation.ts**: Environment variable validation
- **helmet.config.ts**: Helmet security configuration

### Environment Variables

Key environment variables:

- `MONGODB_URI`: MongoDB connection string
- `JWT_ACCESS_SECRET`: JWT access token secret
- `JWT_REFRESH_SECRET`: JWT refresh token secret
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `NODE_ENV`: Environment (development/production)
- `PROCESS_TYPE`: Process type (api/worker/scheduler)

## Process Types

The application supports three process types:

### 1. **API Process** (`main.ts`)

- Handles HTTP requests
- WebSocket connections
- Loads all feature modules
- Rate limiting enabled
- Global exception filter active

### 2. **Worker Process** (`worker.main.ts`)

- Processes background jobs from queues
- Email queue processing
- No HTTP server
- Minimal module loading

### 3. **Scheduler Process** (`scheduler.main.ts`)

- Executes cron jobs
- Scheduled maintenance tasks
- No HTTP server
- Admin module for job tracking

### Process Type Detection

The `process-type.util.ts` utility detects the process type:

- Checks `PROCESS_TYPE` environment variable
- Falls back to `api` if not set
- Used for conditional module loading in `app.module.ts`

## Key Patterns

### 1. **Module Pattern**

- Each feature is a self-contained module
- Modules export services for use in other modules
- Circular dependencies handled with `forwardRef()`

### 2. **DTO Pattern**

- All API inputs/outputs use DTOs
- Validation via `class-validator`
- Transformation via `class-transformer`
- Response DTOs use `@Expose()` decorator

### 3. **Schema Pattern**

- Mongoose schemas in `schemas/` directory
- Timestamps enabled by default
- Soft delete support where applicable
- Indexes for performance

### 4. **Service Pattern**

- Business logic in services
- Services are injectable
- Database operations abstracted
- Error handling at service level

### 5. **Guard Pattern**

- Route protection via guards
- `JwtAuthGuard` for authenticated routes
- Custom guards for specific requirements
- Ownership validation

### 6. **Interceptor Pattern**

- Request/response transformation
- Logging and monitoring
- Global interceptors in `main.ts`

### 7. **Exception Filter Pattern**

- Global exception handling
- Consistent error format
- Environment-aware error messages
- Comprehensive error logging

### 8. **Queue Pattern**

- Background job processing
- Bull queues with Redis
- Job processors in separate modules
- Retry and failure handling

## Module Dependencies

```
AppModule
├── ConfigModule (global)
├── DatabaseModule (global)
├── RedisModule (global)
├── CommonModule (global)
├── QueueModule (API, Worker)
├── SchedulerModule (API, Scheduler)
├── AdminModule (API, Scheduler)
│
└── Feature Modules (API only)
    ├── UsersModule
    ├── AccountsModule
    ├── SessionsModule
    ├── AuthModule
    │   └── EmailModule
    ├── PortfolioModule
    │   └── UsersModule (forwardRef)
    ├── UploadModule
    ├── SettingsModule
    ├── NotificationsModule
    └── WebSocketModule
```

## File Naming Conventions

- **Modules**: `{name}.module.ts`
- **Controllers**: `{name}.controller.ts`
- **Services**: `{name}.service.ts`
- **DTOs**: `{action}-{entity}.dto.ts` (e.g., `create-user.dto.ts`)
- **Schemas**: `{entity}.schema.ts`
- **Guards**: `{name}.guard.ts`
- **Interceptors**: `{name}.interceptor.ts`
- **Filters**: `{name}.filter.ts`
- **Interfaces**: `{name}.interface.ts`
- **Utilities**: `{name}.util.ts`

## Best Practices

1. **Separation of Concerns**: Controllers handle HTTP, services handle business logic
2. **Dependency Injection**: Use NestJS DI for all dependencies
3. **Error Handling**: Use appropriate HTTP exceptions
4. **Validation**: Validate all inputs via DTOs
5. **Type Safety**: Use TypeScript interfaces and types
6. **Documentation**: JSDoc comments for complex logic
7. **Testing**: Unit tests for services, integration tests for controllers
8. **Security**: Always validate ownership, sanitize inputs
9. **Performance**: Use indexes, pagination, caching
10. **Logging**: Structured logging with context

## Common Tasks

### Adding a New Module

1. Create module directory in `modules/`
2. Create `{name}.module.ts`
3. Create service, controller, DTOs, schemas as needed
4. Import module in `app.module.ts` (if API-only)
5. Export services if needed by other modules

### Adding a New Queue

1. Add queue name to `queue/constants/queue-names.constant.ts`
2. Create queue module in `queue/queues/{name}/`
3. Create processor service
4. Create producer service
5. Register in `queue.module.ts`

### Adding a New Scheduled Job

1. Add job to `scheduler/services/scheduler.service.ts`
2. Use `@Cron()` decorator
3. Register in `CronJobTrackerService` for monitoring

### Adding a New Email Template

1. Create HTML template in `modules/email/templates/`
2. Add template rendering in `TemplateService`
3. Use template in `EmailService` methods

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Socket.IO Documentation](https://socket.io/docs/)
