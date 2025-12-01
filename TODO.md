# Console Backend - Development TODO

## Phase 1: Authentication

### 🎉 Status: Phase 1 Core Complete!

**✅ All core authentication features are implemented and working:**

- Backend API endpoints fully functional
- Frontend integration complete
- CORS configured and working
- Database connection stable
- Token-based authentication with refresh flow
- Form validation and error handling
- Route protection implemented

**⚠️ Remaining (Optional/Enhancement):**

- Global exception filter for consistent error formatting
- Testing (unit, integration, E2E)
- API documentation (Swagger)
- Dashboard integration with real user data

---

### 📊 Current State Analysis

#### ✅ Completed

- **Basic NestJS Setup**
  - NestJS 11.0.1 installed
  - Basic app structure (AppModule, AppController, AppService)
  - TypeScript configuration
  - ESLint and Prettier configured
  - Jest testing setup

#### ✅ Completed (Updated)

- **Dependencies**
  - ✅ JWT/Passport packages installed
  - ✅ Argon2 for password hashing installed
  - ✅ class-validator/class-transformer installed
  - ✅ @nestjs/config configured
  - ✅ @nestjs/mongoose configured and working

- **Database**
  - ✅ MongoDB connection setup (DatabaseModule)
  - ✅ Database connection working and tested
  - ✅ Environment variables configuration complete

- **Authentication**
  - ✅ Auth module created
  - ✅ User, Account, Session schemas created
  - ✅ JWT strategies (access & refresh) implemented
  - ✅ Passport configuration complete
  - ✅ Password hashing with Argon2 implemented

- **API Infrastructure**
  - ✅ Global validation pipes configured
  - ✅ CORS configuration complete (supports multiple origins)
  - ✅ API versioning (/api/v1) configured
  - ✅ Logging cleaned up (only essential logs remain)
  - ⚠️ Global exception filters (pending)
  - ⚠️ Request/response interceptors (pending)

- **Security**
  - ✅ Rate limiting (ThrottlerModule) configured
  - ✅ Helmet for security headers configured
  - ✅ Request validation (DTOs) implemented
  - ✅ Logging cleaned up (only essential logs remain)

- **Email Service** ✅
  - ✅ Email module created with nodemailer integration
  - ✅ Email templates (welcome, forgot password, password changed, verify email)
  - ✅ SMTP configuration support
  - ✅ Development mode (console logging) and production mode (real emails)
  - ✅ Integrated with auth service (registration, password reset, etc.)
  - ✅ Environment variables configured

---

### 🎯 Phase 1 Tasks

#### 1. Install Required Dependencies

- [x] **Core Auth Dependencies**

  ```bash
  npm install @nestjs/jwt @nestjs/passport passport passport-jwt
  npm install --save-dev @types/passport-jwt
  ```

- [x] **Password Hashing**

  ```bash
  npm install argon2
  npm install --save-dev @types/argon2
  ```

- [x] **Validation & Transformation**

  ```bash
  npm install class-validator class-transformer
  ```

- [x] **Configuration Management**

  ```bash
  npm install @nestjs/config
  ```

- [x] **MongoDB Integration**

  ```bash
  npm install @nestjs/mongoose
  ```

- [x] **Security & Utilities**
  ```bash
  npm install @nestjs/throttler helmet
  ```

#### 2. Environment Configuration

- [x] **Create `.env` file**
  - [x] `MONGODB_URI` - MongoDB connection string
  - [x] `JWT_ACCESS_SECRET` - Secret for JWT access token signing
  - [x] `JWT_REFRESH_SECRET` - Secret for JWT refresh token signing
  - [x] `JWT_ACCESS_TOKEN_EXPIRATION` - Access token expiration (e.g., "15m")
  - [x] `JWT_REFRESH_TOKEN_EXPIRATION` - Refresh token expiration (e.g., "7d")
  - [x] `PORT` - Server port (default: 3000)
  - [x] `NODE_ENV` - Environment (development/production)

- [x] **Create `.env.example`**
  - [x] Document all required environment variables
  - [x] Include optional variables with defaults

- [x] **Configure ConfigModule**
  - [x] Set up `@nestjs/config` in AppModule
  - [x] Create `config/configuration.ts` for typed config
  - [x] Create `config/env.validation.ts` for environment validation
  - [x] Validate environment variables on startup
  - [x] Add production environment checks

#### 3. Database Setup

- [x] **MongoDB Connection**
  - [x] Create `database/database.module.ts`
  - [x] Configure MongooseModule with connection string
  - [x] Add connection options (retry logic, etc.)
  - [x] Import DatabaseModule in AppModule
  - [x] Database connection working and tested

- [x] **User Schema**
  - [x] Create `users/schemas/user.schema.ts`
  - [x] Fields: username, firstName, lastName, displayName, avatar, role, isActive, lastLoginAt, metadata, bio, location, website
  - [x] Add indexes (username, role)
  - [x] Timestamps enabled (createdAt, updatedAt)

- [x] **Account Schema**
  - [x] Create `accounts/schemas/account.schema.ts`
  - [x] Fields: userId, email, password, emailVerified, emailVerificationToken, passwordResetToken, accountType, oauthProvider, oauthProviderId, isActive
  - [x] Add indexes (email, userId, emailVerificationToken, passwordResetToken)

- [x] **Session Schema**
  - [x] Create `sessions/schemas/session.schema.ts`
  - [x] Fields: userId, accountId, userAgent, fcmToken, ipAddress, deviceType, deviceName, browser, os, isActive, lastActivityAt, expiresAt
  - [x] Add indexes (userId, accountId, expiresAt TTL, fcmToken)
  - [x] User-agent parsing utility implemented for device detection

- [x] **User Module**
  - [x] Create `users/users.module.ts`
  - [x] Create `users/users.service.ts`
  - [x] Create `users/users.controller.ts`
  - [x] Create `users/dto/update-profile.dto.ts`
  - [x] Export UsersService for use in AuthModule

- [x] **Account Module**
  - [x] Create `accounts/accounts.module.ts`
  - [x] Create `accounts/accounts.service.ts`
  - [x] Export AccountsService for use in AuthModule

- [x] **Session Module**
  - [x] Create `sessions/sessions.module.ts`
  - [x] Create `sessions/sessions.service.ts`
  - [x] Create `sessions/sessions.controller.ts`
  - [x] Export SessionsService for use in AuthModule

#### 4. Authentication Module

- [x] **Auth Module Structure**
  - [x] Create `auth/auth.module.ts`
  - [x] Create `auth/auth.controller.ts`
  - [x] Create `auth/auth.service.ts`
  - [x] Create `auth/strategies/jwt.strategy.ts` (Access Token)
  - [x] Create `auth/strategies/jwt-refresh.strategy.ts` (Refresh Token)
  - [x] Create `auth/guards/jwt-auth.guard.ts`
  - [x] Create `auth/guards/jwt-refresh.guard.ts`
  - [x] Create `auth/decorators/get-user.decorator.ts` (for @GetUser() decorator)

- [x] **JWT Configuration**
  - [x] Configure JwtModule in AuthModule
  - [x] Set up access token secret and expiration
  - [x] Set up refresh token secret and expiration
  - [x] Use different secrets for access and refresh tokens (best practice)

- [x] **Password Hashing with Argon2**
  - [x] Create `common/utils/password.util.ts`
  - [x] Implement `hash(password: string, configService): Promise<string>`
  - [x] Implement `verify(hashedPassword: string, plainPassword: string): Promise<boolean>`
  - [x] Configure Argon2 options (memory cost, time cost, parallelism)

- [x] **Token Generation**
  - [x] Implement access token generation (short-lived, 15min)
  - [x] Implement refresh token generation (long-lived, 7 days)
  - [x] Include user ID and email in token payload
  - [x] **Stateless approach**: Don't store tokens in database

#### 5. DTOs (Data Transfer Objects)

- [x] **Auth DTOs**
  - [x] Create `auth/dto/register.dto.ts`
    - `name` (string, min 2, max 50)
    - `email` (string, email format)
    - `password` (string, min 8, matches pattern)
  - [x] Create `auth/dto/login.dto.ts`
    - `email` (string, email format)
    - `password` (string)
  - [x] Create `auth/dto/refresh-token.dto.ts`
    - `refreshToken` (string)
  - [x] Create `auth/dto/forgot-password.dto.ts`
    - `email` (string, email format)
  - [x] Create `auth/dto/reset-password.dto.ts`
    - `token` (string)
    - `password` (string, min 8)
  - [x] Create `auth/dto/verify-email.dto.ts`
    - `token` (string)

- [x] **Response DTOs**
  - [x] Create `auth/dto/auth-response.dto.ts`
    - `accessToken` (string)
    - `refreshToken` (string)
    - `user` (UserResponseDto)
  - [x] Create `auth/dto/user-response.dto.ts`
    - Exclude password and sensitive fields

#### 6. API Endpoints

- [x] **POST /api/v1/auth/register**
  - [x] Validate RegisterDto
  - [x] Check if email already exists
  - [x] Hash password with Argon2
  - [x] Create user in database
  - [x] Generate access and refresh tokens
  - [x] Return AuthResponseDto (without password)
  - [x] Handle duplicate email error

- [x] **POST /api/v1/auth/login**
  - [x] Validate LoginDto
  - [x] Find user by email
  - [x] Verify password with Argon2
  - [x] Generate access and refresh tokens
  - [x] Return AuthResponseDto
  - [x] Handle invalid credentials error

- [x] **POST /api/v1/auth/refresh**
  - [x] Validate RefreshTokenDto
  - [x] Verify refresh token using JwtRefreshStrategy
  - [x] Extract user from token payload
  - [x] Verify user still exists in database
  - [x] Generate new access and refresh tokens (token rotation)
  - [x] Return new AuthResponseDto
  - [x] Handle invalid/expired refresh token

- [x] **POST /api/v1/auth/logout**
  - [x] Protected route (JwtAuthGuard)
  - [x] **Stateless approach**: Just return success (client removes tokens)
  - [ ] Optional: Add token to blacklist if implementing token revocation later

- [x] **GET /api/v1/auth/me**
  - [x] Protected route (JwtAuthGuard)
  - [x] Extract user from JWT payload
  - [x] Fetch user from database
  - [x] Return UserResponseDto
  - [x] Handle user not found

- [x] **POST /api/v1/auth/forgot-password**
  - [x] Validate ForgotPasswordDto
  - [x] Find user by email
  - [x] Generate password reset token (crypto.randomBytes)
  - [x] Store token and expiration in account document
  - [x] Send email with reset link (email service integrated)
  - [x] Return success message (don't reveal if email exists)
  - [x] Security logging for non-existent email attempts

- [x] **POST /api/v1/auth/reset-password**
  - [x] Validate ResetPasswordDto
  - [x] Find user by reset token
  - [x] Check if token is not expired
  - [x] Hash new password with Argon2
  - [x] Update user password
  - [x] Clear reset token fields
  - [x] Send password changed notification email
  - [x] Return success message

- [x] **POST /api/v1/auth/verify-email**
  - [x] Validate VerifyEmailDto
  - [x] Find user by verification token
  - [x] Check if token is not expired
  - [x] Set emailVerified to true
  - [x] Clear verification token
  - [x] Return success message

#### 7. Security & Best Practices

- [x] **Global Pipes**
  - [x] Add ValidationPipe in main.ts
  - [x] Enable transform (auto-transform DTOs)
  - [x] Enable whitelist (strip unknown properties)
  - [x] Configure error messages

- [x] **CORS Configuration**
  - [x] Configure CORS in main.ts
  - [x] Allow frontend origin (from env variable)
  - [x] Support multiple origins (comma-separated)
  - [x] Allow credentials (for httpOnly cookies if used)
  - [x] Configure allowed methods and headers
  - [x] Fixed duplicate CORS header issue

- [ ] **Global Exception Filter**
  - [ ] Create `common/filters/http-exception.filter.ts`
  - [ ] Format error responses consistently
  - [ ] Handle validation errors
  - [ ] Handle database errors (duplicate key, etc.)
  - [ ] Don't expose sensitive error details in production

- [x] **Rate Limiting**
  - [x] Configure ThrottlerModule
  - [x] Set limits for auth endpoints (stricter)
  - [x] Set limits for general endpoints
  - [ ] Configure storage (memory or Redis for production) - Currently using memory

- [x] **Security Headers**
  - [x] Add Helmet middleware
  - [x] Configure security headers (XSS, CSP, etc.)

- [x] **API Versioning**
  - [x] Set up API versioning (v1)
  - [x] Prefix all routes with `/api/v1`

#### 8. Token Strategy (Stateless JWT)

- [x] **Access Token**
  - [x] Short expiration (15 minutes)
  - [x] Contains: userId (sub), email, role
  - [x] Stored in client (localStorage or httpOnly cookie)
  - [x] Used for authenticated requests

- [x] **Refresh Token**
  - [x] Long expiration (7 days)
  - [x] Contains: userId (sub), email, type: 'refresh'
  - [x] Stored in client (httpOnly cookie recommended)
  - [x] Used only for `/api/v1/auth/refresh` endpoint
  - [x] **Not stored in database** (stateless approach)

- [x] **Token Rotation** (Best Practice)
  - [x] On refresh, issue new access AND refresh tokens
  - [x] Old refresh token becomes invalid
  - [x] Prevents token reuse attacks

- [x] **Token Payload Structure**

  ```typescript
  // Access Token
  {
    sub: userId,
    email: user.email,
    role: user.role,
    type: 'access',
    iat: issuedAt,
    exp: expiration
  }

  // Refresh Token
  {
    sub: userId,
    email: user.email,
    type: 'refresh',
    iat: issuedAt,
    exp: expiration
  }
  ```

#### 9. Error Handling

- [ ] **Custom Exceptions**
  - [ ] Create `common/exceptions/bad-request.exception.ts`
  - [ ] Create `common/exceptions/unauthorized.exception.ts`
  - [ ] Create `common/exceptions/forbidden.exception.ts`
  - [ ] Create `common/exceptions/not-found.exception.ts`
  - [ ] Create `common/exceptions/conflict.exception.ts`

- [ ] **Error Messages**
  - [ ] Consistent error response format
  - [ ] User-friendly messages
  - [ ] Include error codes for frontend handling
  - [ ] Don't leak sensitive information

#### 10. Testing

- [ ] **Unit Tests**
  - [ ] Test AuthService methods
  - [ ] Test password hashing/verification
  - [ ] Test token generation
  - [ ] Test UsersService methods

- [ ] **Integration Tests**
  - [ ] Test register endpoint
  - [ ] Test login endpoint
  - [ ] Test refresh token endpoint
  - [ ] Test protected endpoints
  - [ ] Test error scenarios

- [ ] **E2E Tests**
  - [ ] Test complete auth flow
  - [ ] Test token expiration
  - [ ] Test password reset flow

#### 11. Documentation

- [ ] **API Documentation**
  - [ ] Add Swagger/OpenAPI (optional)
  - [ ] Document all endpoints
  - [ ] Document request/response schemas
  - [ ] Document error responses

- [ ] **Code Documentation**
  - [ ] Add JSDoc comments to services
  - [ ] Add inline comments for complex logic
  - [ ] Document environment variables

- [ ] **README Updates**
  - [ ] Add setup instructions
  - [ ] Add environment variables documentation
  - [ ] Add API endpoint documentation
  - [ ] Add development workflow

---

### 🔧 Technical Decisions

#### ✅ Confirmed Decisions

1. **Password Hashing: Argon2**
   - More secure than bcrypt
   - Resistant to GPU/ASIC attacks
   - Configurable memory/time costs

2. **Token Strategy: Stateless JWT**
   - **No token storage in database** (best practice)
   - Access token: 15 minutes
   - Refresh token: 7 days
   - Token rotation on refresh
   - Different secrets for access/refresh tokens

3. **Database: MongoDB with Mongoose**
   - Already installed
   - Flexible schema for future features

4. **Validation: class-validator**
   - NestJS standard
   - Works well with DTOs
   - Automatic validation in controllers

#### 📋 Architecture Notes

- **Stateless Authentication**: Tokens are self-contained, no database lookups needed for validation
- **Token Rotation**: New refresh token on each refresh prevents token reuse
- **Security**: Argon2 for passwords, JWT for tokens, rate limiting for brute force protection
- **Scalability**: Stateless approach allows horizontal scaling without shared session storage

---

### 🚀 Implementation Priority

1. **High Priority** (Core Auth Flow)
   - Install dependencies
   - Database setup
   - User schema
   - Auth module structure
   - Register endpoint
   - Login endpoint
   - JWT strategy
   - Refresh token endpoint

2. **Medium Priority** (Security & UX)
   - Global validation pipes
   - CORS configuration
   - Error handling
   - Rate limiting
   - Forgot/reset password

3. **Low Priority** (Nice to have)
   - Email verification
   - Swagger documentation
   - Advanced security features
   - Token blacklisting (if needed)

---

### 📝 Notes

- **Stateless JWT**: We don't store tokens in the database. Tokens are self-contained and validated by signature.
- **Token Rotation**: Each refresh generates new access AND refresh tokens for better security.
- **Argon2 Configuration**: Use reasonable defaults (memory: 65536, time: 3, parallelism: 4) - adjust based on performance needs.
- **Environment Variables**: All sensitive config should be in `.env`, never commit `.env` to git.
- **Error Messages**: Be careful not to leak information (e.g., "Email not found" vs "Invalid credentials").
- **Email Service**:
  - In development, emails are logged to console if SMTP not configured
  - In production, SMTP configuration is required
  - Email sending is non-blocking (errors logged but don't fail requests)
  - Templates include: welcome, forgot password, password changed, verify email

---

## Settings Module (Backend)

### 🎯 Overview

Backend API endpoints for user settings management including profile updates, password changes, and session management.

### ✅ Completed

- Profile update endpoint (`PATCH /api/v1/users/profile`)
- Session management endpoints (`GET /api/v1/sessions`, `DELETE /api/v1/sessions/:id`, `DELETE /api/v1/sessions`)
- User-agent parsing for device detection
- User schema extended with `bio`, `location`, `website` fields

### 📋 Settings Module Tasks

#### 1. Settings API Endpoints

- [x] **Profile Settings**
  - [x] `GET /api/v1/users/profile` - Get user profile (via `/auth/me`)
  - [x] `PATCH /api/v1/users/profile` - Update user profile
  - [ ] `POST /api/v1/users/profile/avatar` - Upload avatar

- [x] **Password Management**
  - [x] `POST /api/v1/auth/change-password` - Change password
  - [x] Validate current password
  - [x] Hash new password with Argon2
  - [x] Update account password
  - [x] Send password changed notification email

- [x] **Account Management**
  - [x] `POST /api/v1/users/account/request-deletion` - Request account deletion (sends confirmation email)
  - [x] `DELETE /api/v1/users/account` - Delete user account (requires confirmation token)
  - [x] `GET /api/v1/users/account/export` - Export all user data (JSON/CSV format)
  - [x] Hard delete with cascade deletion of all related data
  - [x] Cascade delete related data (sessions, portfolio data, etc.)
  - [x] Send account deletion confirmation email
  - [x] Add confirmation token/flow for security (24-hour expiration)
  - [x] Data export includes: user profile, account info, sessions, all portfolio data

- [x] **Session Management**
  - [x] Session schema created (userId, accountId, userAgent, ipAddress, deviceType, browser, os, isActive, lastActivityAt, expiresAt)
  - [x] SessionsService created with CRUD operations
  - [x] `GET /api/v1/sessions` - Get active sessions for current user
  - [x] `DELETE /api/v1/sessions/:id` - Revoke specific session
  - [x] `DELETE /api/v1/sessions` - Revoke all sessions (except current)
  - [x] Add session device/browser detection (user-agent parsing implemented)
  - [x] Add session location detection (IP-based geolocation with caching)
    - [x] Location service with IP geolocation API (ip-api.com)
    - [x] Caching to avoid excessive API calls (24-hour TTL)
    - [x] Configurable via environment variables (LOCATION_ENABLED, LOCATION_API_URL)
    - [x] Location fields: country, region, city, coordinates, timezone, ISP
    - [x] Frontend displays location information in sessions page

- [ ] **Notification Preferences** (Notification Module)
  - [ ] Create `modules/notifications` directory
  - [ ] Create NotificationPreferences schema (inAppNotifications, pushNotifications, etc.)
  - [ ] Create NotificationPreferences DTOs
  - [ ] Create NotificationPreferences service
  - [ ] Create NotificationPreferences controller
  - [ ] `GET /api/v1/notifications/preferences` - Get notification preferences
  - [ ] `PATCH /api/v1/notifications/preferences` - Update notification preferences
  - [ ] Link preferences to user (userId)

- [ ] **Email Preferences** (Email Module)
  - [ ] Extend existing `modules/email` module
  - [ ] Create EmailPreferences schema (accountActivity, marketing, weeklyDigest, etc.)
  - [ ] Create EmailPreferences DTOs
  - [ ] Create EmailPreferences service
  - [ ] Create EmailPreferences controller
  - [ ] `GET /api/v1/email/preferences` - Get email preferences
  - [ ] `PATCH /api/v1/email/preferences` - Update email preferences
  - [ ] Link preferences to user (userId)
  - [ ] Integrate with email service to respect preferences when sending emails

- [x] **App Preferences**
  - [x] `GET /api/v1/settings/preferences` - Get app preferences
  - [x] `PATCH /api/v1/settings/preferences` - Update app preferences
  - [x] `POST /api/v1/settings/preferences/reset` - Reset preferences to defaults
  - [x] Create preferences schema (separate schema for better organization)
  - [x] Create preferences DTOs (UpdatePreferencesDto, PreferencesResponseDto)
  - [x] Create preferences service with CRUD operations
  - [x] Auto-create default preferences if they don't exist
  - [x] Frontend integration with backend API
  - [x] Loading states and error handling
  - [x] localStorage sync for client-side access

#### 2. Settings Module Structure

- [x] Create `modules/settings` directory
- [x] Create Settings controller
- [x] Create Settings service
- [x] Create Settings DTOs
- [x] Add JWT authentication guards to all endpoints
- [x] Add ownership validation (users can only access their own settings)
  - [x] Profile update ownership validation (implicit via @GetUser())
  - [x] Session ownership validation (verified in SessionsService.revokeSession)
  - [x] Account operations ownership validation (verified in controllers)

#### 3. Security & Validation

- [x] Add password change validation
  - [x] Current password validation
  - [x] New password strength requirements (min 8 chars, uppercase, lowercase, number)
  - [x] Rate limiting (5 requests per minute)
- [x] Add profile update validation
  - [x] First name: 2-50 chars, letters/spaces/hyphens/apostrophes only
  - [x] Last name: 2-50 chars, letters/spaces/hyphens/apostrophes only
  - [x] Display name: 2-50 chars
  - [x] Bio: max 500 chars
  - [x] Location: max 100 chars
  - [x] Website: valid URL with protocol, max 200 chars
- [x] Add session ownership validation
  - [x] Verified in SessionsService.revokeSession method
  - [x] Throws ForbiddenException if session doesn't belong to user
- [x] Add rate limiting for sensitive operations (password change)
  - [x] Password change: 5 requests per minute

---

## Phase 2: Portfolio Data Management

### 🎯 Overview

Portfolio management system for managing personal portfolio data including projects, companies, skills, experiences, and other portfolio-related content.

### 📋 Phase 2 Tasks

#### 1. Portfolio Module Structure

- [x] **Create Portfolio Module**
  - [x] Create `modules/portfolio` directory
  - [x] Create `portfolio.module.ts` (main module file)
  - [x] Create folder structure:
    ```
    portfolio/
      controllers/
        portfolio-projects.controller.ts
        portfolio-companies.controller.ts
        portfolio-skills.controller.ts
        portfolio-experiences.controller.ts
        portfolio-education.controller.ts
        portfolio-certifications.controller.ts
        portfolio-blog.controller.ts
        portfolio-testimonials.controller.ts
        portfolio-contacts.controller.ts
        portfolio-profile.controller.ts
      dto/
        projects/
          create-project.dto.ts
          update-project.dto.ts
          project-response.dto.ts
        companies/
          create-company.dto.ts
          update-company.dto.ts
          company-response.dto.ts
        skills/
          create-skill.dto.ts
          update-skill.dto.ts
          skill-response.dto.ts
        experiences/
          create-experience.dto.ts
          update-experience.dto.ts
          experience-response.dto.ts
        education/
          create-education.dto.ts
          update-education.dto.ts
          education-response.dto.ts
        certifications/
          create-certification.dto.ts
          update-certification.dto.ts
          certification-response.dto.ts
        blog/
          create-blog.dto.ts
          update-blog.dto.ts
          blog-response.dto.ts
        testimonials/
          create-testimonial.dto.ts
          update-testimonial.dto.ts
          testimonial-response.dto.ts
        contacts/
          create-contact.dto.ts
          update-contact.dto.ts
          contact-response.dto.ts
        profile/
          portfolio-profile-response.dto.ts
          update-portfolio-profile.dto.ts
      schemas/
        project.schema.ts
        company.schema.ts
        skill.schema.ts
        experience.schema.ts
        education.schema.ts
        certification.schema.ts
        blog.schema.ts
        testimonial.schema.ts
        contact.schema.ts
        portfolio-profile.schema.ts
      services/
        portfolio-projects.service.ts
        portfolio-companies.service.ts
        portfolio-skills.service.ts
        portfolio-experiences.service.ts
        portfolio-education.service.ts
        portfolio-certifications.service.ts
        portfolio-blog.service.ts
        portfolio-testimonials.service.ts
        portfolio-contacts.service.ts
        portfolio-profile.service.ts
      util/
        portfolio-projects.util.ts (if needed)
        portfolio-companies.util.ts (if needed)
        portfolio-skills.util.ts (if needed)
        portfolio-common.util.ts (shared utilities)
      portfolio.module.ts
    ```
  - [x] Import all portfolio schemas in module
  - [x] Register all portfolio services and controllers
  - [x] Export portfolio services for use in other modules

#### 2. Portfolio Projects

- [x] **Schema & DTOs**
  - [x] Create `schemas/project.schema.ts` (title, description, image, url, githubUrl, tags, technologies, startDate, endDate, featured, order, userId, etc.)
  - [x] Create `dto/projects/create-project.dto.ts`
  - [x] Create `dto/projects/update-project.dto.ts`
  - [x] Create `dto/projects/project-response.dto.ts`
  - [x] Add project ownership (link to user)
  - [x] Add project ordering/sorting

- [x] **Service & Controller**
  - [x] Create `services/portfolio-projects.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-projects.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-projects.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/projects` - List all projects (with pagination)
  - [x] `GET /api/v1/portfolio/projects/:id` - Get single project
  - [x] `POST /api/v1/portfolio/projects` - Create project (protected)
  - [x] `PATCH /api/v1/portfolio/projects/:id` - Update project (protected)
  - [x] `DELETE /api/v1/portfolio/projects/:id` - Delete project (protected)
  - [x] `PATCH /api/v1/portfolio/projects/reorder` - Reorder projects (protected)

#### 3. Portfolio Companies

- [x] **Schema & DTOs**
  - [x] Create `schemas/company.schema.ts` (name, logo, website, description, industry, location, foundedYear, userId, etc.)
  - [x] Create `dto/companies/create-company.dto.ts`
  - [x] Create `dto/companies/update-company.dto.ts`
  - [x] Create `dto/companies/company-response.dto.ts`
  - [x] Add company ownership (link to user)

- [x] **Service & Controller**
  - [x] Create `services/portfolio-companies.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-companies.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-companies.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/companies` - List all companies
  - [x] `GET /api/v1/portfolio/companies/:id` - Get single company
  - [x] `POST /api/v1/portfolio/companies` - Create company (protected)
  - [x] `PATCH /api/v1/portfolio/companies/:id` - Update company (protected)
  - [x] `DELETE /api/v1/portfolio/companies/:id` - Delete company (protected)

#### 4. Portfolio Skills

- [x] **Schema & DTOs**
  - [x] Create `schemas/skill.schema.ts` (name, category, level, icon, color, order, userId, etc.)
  - [x] Create `dto/skills/create-skill.dto.ts`
  - [x] Create `dto/skills/update-skill.dto.ts`
  - [x] Create `dto/skills/skill-response.dto.ts`
  - [x] Add skill categories enum/validation
  - [x] Add skill ownership (link to user)

- [x] **Service & Controller**
  - [x] Create `services/portfolio-skills.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-skills.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-skills.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/skills` - List all skills (grouped by category with ?grouped=true)
  - [x] `GET /api/v1/portfolio/skills/:id` - Get single skill
  - [x] `POST /api/v1/portfolio/skills` - Create skill (protected)
  - [x] `PATCH /api/v1/portfolio/skills/:id` - Update skill (protected)
  - [x] `DELETE /api/v1/portfolio/skills/:id` - Delete skill (protected)
  - [x] `PATCH /api/v1/portfolio/skills/reorder` - Reorder skills (protected)

#### 5. Portfolio Experiences

- [x] **Schema & DTOs**
  - [x] Create `schemas/experience.schema.ts` (title, company, companyId, location, startDate, endDate, current, description, achievements, technologies, userId, etc.)
  - [x] Create `dto/experiences/create-experience.dto.ts`
  - [x] Create `dto/experiences/update-experience.dto.ts`
  - [x] Create `dto/experiences/experience-response.dto.ts`
  - [x] Add experience ownership (link to user)
  - [x] Link experiences to companies (optional reference)

- [x] **Service & Controller**
  - [x] Create `services/portfolio-experiences.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-experiences.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-experiences.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/experiences` - List all experiences (sorted by date)
  - [x] `GET /api/v1/portfolio/experiences/:id` - Get single experience
  - [x] `POST /api/v1/portfolio/experiences` - Create experience (protected)
  - [x] `PATCH /api/v1/portfolio/experiences/:id` - Update experience (protected)
  - [x] `DELETE /api/v1/portfolio/experiences/:id` - Delete experience (protected)

#### 6. Portfolio Education

- [x] **Schema & DTOs**
  - [x] Create `schemas/education.schema.ts` (institution, degree, field, startDate, endDate, gpa, description, userId, etc.)
  - [x] Create `dto/education/create-education.dto.ts`
  - [x] Create `dto/education/update-education.dto.ts`
  - [x] Create `dto/education/education-response.dto.ts`
  - [x] Add education ownership (link to user)

- [x] **Service & Controller**
  - [x] Create `services/portfolio-education.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-education.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-education.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/education` - List all education entries
  - [x] `GET /api/v1/portfolio/education/:id` - Get single education entry
  - [x] `POST /api/v1/portfolio/education` - Create education entry (protected)
  - [x] `PATCH /api/v1/portfolio/education/:id` - Update education entry (protected)
  - [x] `DELETE /api/v1/portfolio/education/:id` - Delete education entry (protected)

#### 7. Portfolio Certifications

- [x] **Schema & DTOs**
  - [x] Create `schemas/certification.schema.ts` (name, issuer, issueDate, expiryDate, credentialId, credentialUrl, userId, etc.)
  - [x] Create `dto/certifications/create-certification.dto.ts`
  - [x] Create `dto/certifications/update-certification.dto.ts`
  - [x] Create `dto/certifications/certification-response.dto.ts`
  - [x] Add certification ownership (link to user)

- [x] **Service & Controller**
  - [x] Create `services/portfolio-certifications.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-certifications.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-certifications.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/certifications` - List all certifications
  - [x] `GET /api/v1/portfolio/certifications/:id` - Get single certification
  - [x] `POST /api/v1/portfolio/certifications` - Create certification (protected)
  - [x] `PATCH /api/v1/portfolio/certifications/:id` - Update certification (protected)
  - [x] `DELETE /api/v1/portfolio/certifications/:id` - Delete certification (protected)

#### 8. Portfolio Blog/Articles

- [x] **Schema & DTOs**
  - [x] Create `schemas/blog.schema.ts` (title, slug, content, excerpt, coverImage, published, publishedAt, tags, userId, etc.)
  - [x] Create `dto/blog/create-blog.dto.ts`
  - [x] Create `dto/blog/update-blog.dto.ts`
  - [x] Create `dto/blog/blog-response.dto.ts`
  - [x] Add blog ownership (link to user)
  - [x] Add slug generation and uniqueness validation

- [x] **Service & Controller**
  - [x] Create `services/portfolio-blog.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-blog.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-blog.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/blog` - List all blog posts (with pagination)
  - [x] `GET /api/v1/portfolio/blog/:id` or `/:slug` - Get single blog post
  - [x] `POST /api/v1/portfolio/blog` - Create blog post (protected)
  - [x] `PATCH /api/v1/portfolio/blog/:id` - Update blog post (protected)
  - [x] `DELETE /api/v1/portfolio/blog/:id` - Delete blog post (protected)
  - [x] `PATCH /api/v1/portfolio/blog/:id/publish` - Publish/unpublish blog post (protected)

#### 9. Portfolio Testimonials

- [x] **Schema & DTOs**
  - [x] Create `schemas/testimonial.schema.ts` (name, role, company, content, avatar, rating, featured, order, userId, etc.)
  - [x] Create `dto/testimonials/create-testimonial.dto.ts`
  - [x] Create `dto/testimonials/update-testimonial.dto.ts`
  - [x] Create `dto/testimonials/testimonial-response.dto.ts`
  - [x] Add testimonial ownership (link to user)

- [x] **Service & Controller**
  - [x] Create `services/portfolio-testimonials.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-testimonials.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-testimonials.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/testimonials` - List all testimonials
  - [x] `GET /api/v1/portfolio/testimonials/:id` - Get single testimonial
  - [x] `POST /api/v1/portfolio/testimonials` - Create testimonial (protected)
  - [x] `PATCH /api/v1/portfolio/testimonials/:id` - Update testimonial (protected)
  - [x] `DELETE /api/v1/portfolio/testimonials/:id` - Delete testimonial (protected)
  - [x] `PATCH /api/v1/portfolio/testimonials/reorder` - Reorder testimonials (protected)

#### 10. Portfolio Contacts/Social Links

- [x] **Schema & DTOs**
  - [x] Create `schemas/contact.schema.ts` (platform, url, icon, order, active, userId, etc.)
  - [x] Create `dto/contacts/create-contact.dto.ts`
  - [x] Create `dto/contacts/update-contact.dto.ts`
  - [x] Create `dto/contacts/contact-response.dto.ts`
  - [x] Add contact ownership (link to user)

- [x] **Service & Controller**
  - [x] Create `services/portfolio-contacts.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-contacts.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-contacts.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/contacts` - List all contact links
  - [x] `GET /api/v1/portfolio/contacts/:id` - Get single contact link
  - [x] `POST /api/v1/portfolio/contacts` - Create contact link (protected)
  - [x] `PATCH /api/v1/portfolio/contacts/:id` - Update contact link (protected)
  - [x] `DELETE /api/v1/portfolio/contacts/:id` - Delete contact link (protected)
  - [x] `PATCH /api/v1/portfolio/contacts/reorder` - Reorder contact links (protected)

#### 11. Portfolio Profile/Settings

- [x] **Schema & DTOs**
  - [x] Create `schemas/portfolio-profile.schema.ts` (bio, avatar, resumeUrl, location, availableForHire, portfolioUrl, theme, userId, etc.)
  - [x] Create `dto/profile/portfolio-profile-response.dto.ts`
  - [x] Create `dto/profile/update-portfolio-profile.dto.ts`
  - [x] Link profile to user

- [x] **Service & Controller**
  - [x] Create `services/portfolio-profile.service.ts` (CRUD operations)
  - [x] Create `controllers/portfolio-profile.controller.ts` (REST API endpoints)
  - [x] Create `util/portfolio-profile.util.ts` (utility functions if needed)

- [x] **API Endpoints**
  - [x] `GET /api/v1/portfolio/profile` - Get user portfolio profile
  - [x] `PATCH /api/v1/portfolio/profile` - Update portfolio profile (protected)
  - [x] `POST /api/v1/portfolio/profile/avatar` - Upload avatar (protected)
  - [x] `POST /api/v1/portfolio/profile/resume` - Upload resume (protected)

#### 11. Common Infrastructure

- [x] **File Upload Service**
  - [x] Create file upload module (`modules/upload`)
  - [x] Support image uploads (projects, companies, avatars, etc.) - `/api/v1/upload/image`, `/api/v1/upload/images`, `/api/v1/upload/avatar`
  - [x] Support document uploads (resumes, certificates, etc.) - `/api/v1/upload/document`, `/api/v1/upload/resume`
  - [x] Add file validation (type, size) - configurable via env vars
  - [x] Add file storage (local storage with `uploads/` directory) - ready for cloud storage extension
  - [x] Add image optimization/resizing - using Sharp library with thumbnail generation

- [x] **Common Features**
  - [x] Add soft delete support to all portfolio schemas (deletedAt field + plugin)
  - [x] Add timestamps (createdAt, updatedAt) to all schemas - already implemented via @Schema({ timestamps: true })
  - [x] Add ordering/sorting support - already implemented (order field in Project, Skill, Testimonial, Contact)
  - [x] Add bulk operations (delete, reorder, etc.) - bulkSoftDelete utility created, reorder already exists
  - [x] Add portfolio item relationships/joins (populate companyId in Experience) - Experience service now populates company data, DTO updated to handle populated company object
  - [x] Add data validation and sanitization - DTOs with class-validator already handle this

- [x] **Security & Authorization**
  - [x] Ensure all portfolio endpoints are protected (JWT auth) - all controllers use @UseGuards(JwtAuthGuard)
  - [x] Add ownership validation (users can only access their own data) - all services validate userId ownership
  - [x] Add role-based access control (if needed) - not needed for portfolio (all users can manage their own)
  - [x] Add rate limiting for portfolio endpoints - @Throttle decorator added (20 req/min for protected, 60 req/min for public)

- [x] **Public Portfolio API**
  - [x] Create public read-only endpoints for portfolio data - `/api/v1/public/portfolio/*` endpoints created
  - [x] Add portfolio visibility settings - added to PortfolioProfile schema (isPublic, showProjects, showCompanies, etc.)
  - [x] Add portfolio theme/settings API - theme field already exists, visibility settings added to profile DTO

#### 12. Database Indexes & Optimization

- [x] Add indexes for frequently queried fields - Added companyId index for Experience, compound indexes for userId + deletedAt
- [x] Add indexes for userId (ownership queries) - All schemas have userId indexes, added compound indexes for common query patterns
- [x] Add indexes for ordering fields - Order fields indexed where applicable (order, startDate, issueDate, etc.)
- [ ] Optimize queries with proper MongoDB aggregation (optional - current queries are efficient)
- [x] Add pagination support for all list endpoints - All services now support pagination with page/limit parameters

#### 13. Standard Reusable Response Handlers

- [x] Create common response handler utilities (`common/responses/`)
  - [x] Create response interfaces/types (SuccessResponse, PaginatedResponse, ErrorResponse)
  - [x] Create helper functions (successResponse, paginatedResponse, errorResponse, createdResponse, noContentResponse)
  - [x] Support dynamic pagination metadata (calculatePaginationMeta helper)
  - [x] Support custom status codes and messages

- [x] Implement response handlers in Portfolio Module Controllers:
  - [x] `portfolio-projects.controller.ts` - ✅ All endpoints updated
  - [x] `portfolio-companies.controller.ts` - ✅ All endpoints updated
  - [x] `portfolio-skills.controller.ts` - ✅ All endpoints updated
  - [x] `portfolio-experiences.controller.ts` - ✅ All endpoints updated
- [x] `portfolio-education.controller.ts` - ✅ All endpoints updated
- [x] `portfolio-certifications.controller.ts` - ✅ All endpoints updated
- [x] `portfolio-blog.controller.ts` - ✅ All endpoints updated
- [x] `portfolio-testimonials.controller.ts` - ✅ All endpoints updated
- [x] `portfolio-contacts.controller.ts` - ✅ All endpoints updated
- [x] `portfolio-profile.controller.ts` - ✅ All endpoints updated
- [ ] `portfolio-public.controller.ts` - ⚠️ Public API (may use different response format)

- [x] Implement response handlers in Auth Module Controller:
  - [x] `auth/auth.controller.ts`
    - [x] `POST /auth/register` - Register endpoint
    - [x] `POST /auth/login` - Login endpoint
    - [x] `POST /auth/refresh` - Refresh token endpoint
    - [x] `POST /auth/logout` - Logout endpoint
    - [x] `GET /auth/me` - Get current user endpoint
    - [x] `POST /auth/forgot-password` - Forgot password endpoint
    - [x] `POST /auth/reset-password` - Reset password endpoint
    - [x] `POST /auth/verify-email` - Verify email endpoint
    - [x] `POST /auth/change-password` - Change password endpoint

- [x] Implement response handlers in Users Module Controller:
  - [x] `users/users.controller.ts`
    - [x] `PATCH /users/profile` - Update user profile endpoint

- [x] Implement response handlers in Sessions Module Controller:
  - [x] `sessions/sessions.controller.ts`
    - [x] `GET /sessions` - Get all sessions endpoint (returns array, pagination can be added later if needed)
    - [x] `DELETE /sessions/:id` - Revoke session endpoint
    - [x] `DELETE /sessions` - Revoke all sessions endpoint

- [x] Implement response handlers in Upload Module Controller:
  - [x] `upload/upload.controller.ts`
    - [x] `POST /upload/image` - Upload single image endpoint
    - [x] `POST /upload/images` - Upload multiple images endpoint
    - [x] `POST /upload/document` - Upload document endpoint
    - [x] `POST /upload/avatar` - Upload avatar endpoint
    - [x] `POST /upload/resume` - Upload resume endpoint

---

### 🚀 Phase 2 Priority Order

1. **High Priority** (Core Portfolio Data)
   - Portfolio Project Module
   - Portfolio Experience Module
   - Portfolio Skill Module
   - Portfolio Profile/Settings Module
   - File Upload Service

2. **Medium Priority** (Additional Content)
   - Portfolio Company Module
   - Portfolio Education Module
   - Portfolio Certification Module
   - Portfolio Contact/Social Links Module

3. **Low Priority** (Nice to have)
   - Portfolio Blog/Article Module
   - Portfolio Testimonial Module
   - Public Portfolio API
   - Advanced features (themes, sharing, etc.)

---

### 📝 Phase 2 Notes

- **Data Ownership**: All portfolio items should be linked to a user (userId field)
- **Soft Delete**: Consider implementing soft delete for all portfolio items
- **Ordering**: Many portfolio items need ordering (projects, skills, testimonials, etc.)
- **File Storage**: Decide on file storage strategy (local filesystem vs cloud storage)
- **Relationships**: Consider relationships between portfolio items (e.g., experience → company, project → skills)
- **Public API**: Design public portfolio API endpoints for displaying portfolio publicly

---

## Phase 3: Production Infrastructure & Improvements

### 🎯 Overview

Create a production-ready NestJS backend infrastructure that includes queue workers, scheduled jobs, WebSocket support, and process management.

### 📋 Phase 3 Tasks

#### 1. Queue System (Bull + Redis)

- [x] **Install Dependencies**
  - [x] Install `@nestjs/bull` and `bull`
  - [x] Install `redis` client
  - [x] Install `@nestjs/schedule` for cron jobs
  - [x] Install `@nestjs/websockets` and `socket.io`
  - [x] Install `@bull-board/api` and `@bull-board/express` for queue dashboard
  - [x] Install TypeScript types (`@types/bull`, `@types/redis`)
  - [x] PM2 (installed as dev dependency for local testing)

- [x] **Redis Configuration**
  - [x] Add Redis connection configuration to `config/configuration.ts`
  - [x] Add Redis environment variables to `.env.example`
  - [x] Create Redis module (`modules/redis/redis.module.ts`)
  - [x] Configure Redis connection with retry logic (exponential backoff, max 10 retries)
  - [x] Add Redis health check (`GET /api/v1/health/redis` and protected endpoint)
  - [x] Create RedisService with helper methods (get, set, del, exists, expire)
  - [x] Graceful degradation (app can start without Redis in development)
  - [x] Connection event logging (connect, ready, error, reconnecting, end)

- [x] **Bull Queue Setup**
  - [x] Create `modules/queue/queue.module.ts`
  - [x] Configure BullModule with Redis connection
  - [x] Create queue names enum/constants (`QueueNames` enum)
  - [x] Set up queue options (default job options, retry logic, etc.)
  - [x] Queue-specific configurations (email queue with custom retry settings)
  - [x] Global module for app-wide queue access
  - [x] Exponential backoff retry strategy
  - [x] Job cleanup configuration (removeOnComplete, removeOnFail)

- [x] **Email Queue Implementation**
  - [x] Create `modules/queue/queues/email/` directory structure
  - [x] Create email job data interfaces (`EmailJobData`, `EmailJobType`, specific job data types)
  - [x] Create email job result interface (`EmailJobResult`)
  - [x] Create email queue processor service (`EmailQueueProcessorService`)
  - [x] Create email queue producer service (`EmailQueueProducerService`)
  - [x] Move email sending logic to queue processor (SMTP sending in processor)
  - [x] Update email service to use queue producer (all email methods queue jobs)
  - [x] Handle job failures and retries (via Bull retry mechanism)
  - [x] Register email queue module in QueueModule
  - [x] Integrate EmailQueueModule with EmailModule
  - [x] Add queue statistics method
  - [x] Add job lifecycle hooks (onActive, onCompleted, onFailed)

- [x] **Queue Dashboard (Bull Board)**
  - [x] Install and configure Bull Board (already installed)
  - [x] Create admin queue dashboard route (`/api/v1/admin/queues/ui`)
  - [x] Add authentication/authorization for admin routes (JWT guard)
  - [x] Register all queues in Bull Board (email queue registered)
  - [x] Add queue monitoring and statistics endpoint (`/api/v1/admin/queues/stats`)
  - [x] Create BullBoardService for centralized configuration
  - [x] Create AdminModule and AdminController
  - [x] Add catch-all route handler for Bull Board UI and API routes

- [x] **Queue Job Management Endpoints**
  - [x] `POST /api/v1/admin/queues/:queueName/jobs/:jobId/retry` - Retry a failed job
  - [x] `DELETE /api/v1/admin/queues/:queueName/jobs/clean` - Clean completed/failed jobs (with status filter)
  - [x] `GET /api/v1/admin/queues/:queueName/jobs/failed` - Get failed jobs with pagination
  - [x] `GET /api/v1/admin/queues/:queueName/jobs/history` - Get job history by status (completed/failed/active/waiting/delayed)
  - [x] All endpoints use standardized response handlers (`successResponse`)
  - [x] Queue ownership validation (getQueueByName helper method)
  - [x] Error handling with NotFoundException for invalid queue/job
  - [x] Fixed TypeScript errors with `queue.clean()` method (type casting workaround)

#### 2. Scheduled Jobs (Cron Tasks)

- [x] **Cron Module Setup**
  - [x] Configure `@nestjs/schedule` in AppModule (via SchedulerModule)
  - [x] Create `modules/scheduler/scheduler.module.ts`
  - [x] Add cron job decorators and services (`@Cron`, `CronExpression`)
  - [x] Create SchedulerService with sample cron job
  - [x] Import ScheduleModule.forRoot() in SchedulerModule

- [x] **Sample Cron Jobs**
  - [x] Create sample cron job (runs every 5 minutes)
  - [x] Add cron job for session cleanup (expired sessions) - runs every hour
  - [x] Add cron job for email queue monitoring - runs every 10 minutes
  - [x] Add cron job for database maintenance (optional) - runs weekly on Sunday at 2 AM, disabled by default
  - [x] Add cron job for account deletion token cleanup - runs daily at midnight
  - [x] Add cron job configuration via environment variables (all jobs can be enabled/disabled)
  - [x] Add cleanupExpiredDeletionTokens method to AccountsService
  - [x] Add scheduler configuration to config interface and configuration.ts

- [x] **Cron Job Management**
  - [x] Add cron job logging (all jobs include Logger with execution logs)
  - [x] Add cron job error handling (try-catch blocks with error logging in all jobs)
  - [ ] Add cron job status tracking (optional - can be added later for monitoring)
  - [x] Add ability to enable/disable cron jobs via config (all jobs check config before execution)

#### 3. WebSocket Gateway (Socket.IO)

- [x] **WebSocket Module Setup**
  - [x] Install `@nestjs/websockets` and `socket.io` (already installed)
  - [x] Install `@nestjs/platform-socket.io` for Socket.IO adapter
  - [x] Create `modules/websocket/websocket.module.ts`
  - [x] Configure Socket.IO adapter in `main.ts` (IoAdapter)
  - [x] Add WebSocket authentication (JWT) - `WsJwtAuthGuard` created
  - [x] Create `BaseGateway` for common WebSocket functionality
  - [x] Create `GetWsUser` decorator for extracting user from socket
  - [x] Export `JwtModule` from `AuthModule` for WebSocket guard
  - [x] Integrate `WebSocketModule` into `AppModule`
  - [x] Token extraction from handshake auth, query params, or Authorization header

- [x] **Sample Chat Gateway**
  - [x] Create `modules/websocket/gateways/chat.gateway.ts`
  - [x] Implement connection handling (extends BaseGateway, handles connection/disconnection)
  - [x] Implement message broadcasting (broadcasts to rooms, supports multiple rooms)
  - [x] Implement room/namespace support (joinRoom, leaveRoom, default 'general' room)
  - [x] Add user presence tracking (online/away/offline status, presence updates)
  - [x] Add typing indicators (typing events, per-room tracking)
  - [x] Add message history (in-memory storage, last 100 messages per room, optional)
  - [x] Create chat message interfaces (ChatMessage, TypingIndicator, UserPresence)
  - [x] Register ChatGateway in WebSocketModule

- [x] **WebSocket Events**
  - [x] Define WebSocket event types/interfaces (`websocket-events.interface.ts` with WebSocketEventType enum, event payloads, error/success responses)
  - [x] Add event validation (DTOs: MessageEventDto, JoinRoomEventDto, LeaveRoomEventDto, TypingEventDto with class-validator decorators)
  - [x] Add error handling for WebSocket events (`WsExceptionFilter` catches and formats errors, sends error responses to clients)
  - [x] Add rate limiting for WebSocket connections (`WsRateLimitGuard` with configurable limits, per-user tracking, auto-disconnect on limit exceeded)
  - [x] Integrate validation, error handling, and rate limiting into ChatGateway
  - [x] Register guards and filters in WebSocketModule

#### 4. Process Management (PM2)

- [x] **PM2 Configuration**
  - [x] Create `ecosystem.config.js` with:
    - [x] API server (cluster mode, multiple instances using all CPU cores)
    - [x] Worker process (fork mode, single instance)
    - [x] Scheduler process (fork mode, single instance)
  - [x] Configure environment variables per process (PROCESS_TYPE, NODE_ENV, PORT)
  - [x] Configure logging per process (separate log files: api, worker, scheduler)
  - [x] Configure restart policies (autorestart, max_restarts, min_uptime, restart_delay)
  - [x] Configure memory limits (1G for API/Worker, 512M for Scheduler)

- [x] **Entry Points**
  - [x] Create `src/worker.main.ts` for queue workers (uses ApplicationContext, no HTTP server)
  - [x] Create `src/scheduler.main.ts` for cron jobs (uses ApplicationContext, no HTTP server)
  - [x] Update `src/main.ts` for API server only (validates process type, HTTP server + WebSocket)
  - [x] Add process-specific module loading (conditional imports in AppModule based on process type)
  - [x] Create process type utility (`utils/process-type.util.ts`) for detecting process type

- [x] **Process Separation**
  - [x] Ensure queue processors only load in worker process (QueueModule conditionally loaded)
  - [x] Ensure cron jobs only load in scheduler process (SchedulerModule conditionally loaded)
  - [x] Ensure API routes only load in API process (controllers and feature modules conditionally loaded)
  - [x] Add process type detection utility (`utils/process-type.util.ts` with ProcessType enum and helper functions)

#### 5. Security & Performance Improvements

- [x] **CORS Configuration**
  - [x] Review and optimize CORS settings (added more allowed headers, exposed headers, optimized optionsSuccessStatus)
  - [x] Add environment-specific CORS origins (development defaults, production requires explicit CORS_ORIGIN)
  - [x] Add CORS preflight caching (maxAge: 86400 seconds / 24 hours, configurable via CORS_PREFLIGHT_MAX_AGE)
  - [x] Enhanced CORS configuration in `config/configuration.ts` with automatic origin parsing
  - [x] Production validation warning if no CORS origins configured
  - [x] Support for comma-separated origins in environment variable

- [x] **Helmet Configuration**
  - [x] Review and optimize Helmet settings (comprehensive security headers configuration)
  - [x] Add Content Security Policy (CSP) with environment-specific directives (report-only in dev, enforced in prod)
  - [x] Configure security headers per environment (development vs production)
  - [x] Created `config/helmet.config.ts` with comprehensive security headers:
    - Content Security Policy (CSP) with CORS-aware connectSrc
    - Cross-Origin Embedder Policy (COEP) - production only
    - Cross-Origin Opener Policy (COOP) - same-origin
    - Cross-Origin Resource Policy (CORP) - cross-origin
    - DNS Prefetch Control
    - Expect-CT header
    - Frameguard (X-Frame-Options) - deny
    - Hide Powered-By header
    - HSTS (HTTP Strict Transport Security) - 1 year, includeSubDomains, preload in prod
    - IE No Open
    - No Sniff (X-Content-Type-Options)
    - Origin Agent Cluster
    - Permissions Policy (comprehensive feature restrictions)
    - Referrer Policy - strict-origin-when-cross-origin
    - XSS Protection (legacy)

- [ ] **Body Size Limits**
  - [ ] Configure JSON body parser size limits
  - [ ] Configure file upload size limits
  - [ ] Add request size validation middleware

- [ ] **Rate Limiting**
  - [ ] Review rate limiting configuration
  - [ ] Add different limits for different endpoints
  - [ ] Add Redis-based rate limiting (optional)

#### 6. Environment Configuration

- [x] **Update .env.example**
  - [x] Add Redis connection string (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_RETRY_DELAY, REDIS_MAX_RETRIES, REDIS_ENABLE_READY_CHECK, REDIS_ENABLE_OFFLINE_QUEUE)
  - [x] Add queue configuration variables (configured via Redis, documented in comments)
  - [x] Add WebSocket configuration (WS_RATE_LIMIT_PER_MINUTE, WS_RATE_LIMIT_PER_HOUR)
  - [x] Add cron job enable/disable flags (SCHEDULER_SAMPLE_JOB_ENABLED, SCHEDULER_SESSION_CLEANUP_ENABLED, SCHEDULER_EMAIL_QUEUE_MONITORING_ENABLED, SCHEDULER_EMAIL_QUEUE_WARNING_THRESHOLD, SCHEDULER_ACCOUNT_DELETION_TOKEN_CLEANUP_ENABLED, SCHEDULER_DATABASE_MAINTENANCE_ENABLED)
  - [x] Add PM2 configuration variables (PROCESS_TYPE: api, worker, or scheduler)
  - [x] Add Bull Board authentication (BULL_BOARD_USERNAME, BULL_BOARD_PASSWORD - optional, for basic auth)
  - [x] Created comprehensive `.env.example` with all environment variables organized by category
  - [x] Added production notes and required variables documentation

- [x] **Environment Validation**
  - [x] Update `config/env.validation.ts` with new variables:
    - [x] CORS configuration (CORS_CREDENTIALS, CORS_PREFLIGHT_MAX_AGE - CORS_ORIGIN already existed)
    - [x] Redis connection validation (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_RETRY_DELAY, REDIS_MAX_RETRIES, REDIS_ENABLE_READY_CHECK, REDIS_ENABLE_OFFLINE_QUEUE)
    - [x] WebSocket configuration (WS_RATE_LIMIT_PER_MINUTE, WS_RATE_LIMIT_PER_HOUR)
    - [x] Scheduler/cron job configuration (SCHEDULER_SAMPLE_JOB_ENABLED, SCHEDULER_SESSION_CLEANUP_ENABLED, SCHEDULER_EMAIL_QUEUE_MONITORING_ENABLED, SCHEDULER_EMAIL_QUEUE_WARNING_THRESHOLD, SCHEDULER_ACCOUNT_DELETION_TOKEN_CLEANUP_ENABLED, SCHEDULER_DATABASE_MAINTENANCE_ENABLED)
    - [x] PM2 configuration (PROCESS_TYPE with validation for 'api', 'worker', 'scheduler' using IsIn)
    - [x] Bull Board authentication (BULL_BOARD_USERNAME, BULL_BOARD_PASSWORD)
  - [x] Add validation for Redis connection (host, port 1-65535, db 0-15, retry settings with min values)
  - [x] Add validation for queue configuration (configured via Redis, validated through Redis connection settings)

#### 7. Documentation & Examples

- [ ] **Code Documentation**
  - [ ] Add JSDoc comments to queue services
  - [ ] Add JSDoc comments to WebSocket gateway
  - [ ] Add JSDoc comments to cron jobs
  - [ ] Add inline comments for complex logic

- [x] **README Updates**
  - [x] Add PM2 setup instructions (installation, configuration, usage, process types, environment variables)
  - [x] Add Redis setup instructions (installation for macOS/Linux/Docker, configuration, testing)
  - [x] Add queue system documentation (available queues, adding jobs, monitoring, creating new queues)
  - [x] Add WebSocket usage examples (server-side gateway, client-side connection, authentication, rate limiting, available events)
  - [x] Add cron job configuration guide (available jobs, configuration, creating new jobs, cron expression format)
  - [x] Updated README with comprehensive documentation including features, prerequisites, setup, and all system components

- [x] **Sample Implementations**
  - [x] Email queue producer example (`modules/queue/queues/email/email-queue-producer.service.ts`)
  - [x] Email queue processor example (`modules/queue/queues/email/email-queue-processor.service.ts`)
  - [x] Cron job example (multiple cron jobs implemented: sample job, session cleanup, email queue monitoring, account deletion token cleanup, database maintenance)
  - [x] WebSocket chat gateway example (`modules/websocket/gateways/chat.gateway.ts` with full chat functionality)

#### 8. Testing & Monitoring

- [ ] **Queue Testing**
  - [ ] Add unit tests for queue producers
  - [ ] Add unit tests for queue processors
  - [ ] Add integration tests for queue flow

- [ ] **WebSocket Testing**
  - [ ] Add unit tests for WebSocket gateway
  - [ ] Add integration tests for WebSocket events

- [x] **Monitoring**
  - [x] Add queue metrics (job success/failure rates, throughput) - MetricsService collects queue metrics
  - [x] Add Redis metrics (memory usage, connections, keyspace, latency) - MetricsService collects Redis metrics via INFO command
  - [x] Add MongoDB metrics (connection pool, collections, databases, server status) - MetricsService collects MongoDB metrics
  - [x] Add API metrics (request rate, error rate, response time percentiles) - MetricsService tracks API metrics with recordApiRequest method
  - [x] Add system metrics endpoint (`GET /api/v1/admin/metrics`) - AdminController.getSystemMetrics() endpoint
  - [ ] Add WebSocket connection metrics (optional - can be added later)
  - [x] Add cron job execution metrics - CronJobTrackerService tracks execution history and status
  - [x] Add health check endpoints for all services - Redis health check exists, system health can be extended

### 🚀 Phase 3 Priority Order

1. **High Priority** (Core Infrastructure)
   - Redis configuration
   - Bull queue setup
   - Email queue implementation
   - PM2 configuration
   - Entry points separation

2. **Medium Priority** (Additional Features)
   - WebSocket gateway
   - Cron jobs
   - Bull Board dashboard
   - Security improvements

3. **Low Priority** (Nice to have)
   - Advanced monitoring
   - Additional queue types
   - WebSocket features (rooms, presence, etc.)
   - Comprehensive testing

### 📝 Phase 3 Notes

- **No Docker**: All setup should work without Docker/Docker Compose
- **Redis Required**: Queue system requires Redis to be running
- **PM2 Process Management**: Use PM2 to run API, Worker, and Scheduler separately
- **TypeScript**: All code must be fully typed
- **Modular Structure**: Each feature should be in its own module
- **Environment Variables**: All configuration should come from `.env`
- **Best Practices**: Follow NestJS dependency injection and module patterns
- **Queue Dashboard**: Accessible at `/admin/queues/ui` (protected route)
- **Process Separation**: API, Worker, and Scheduler should be separate processes
