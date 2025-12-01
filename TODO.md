# Console Backend - Development TODO

> **Note**: For completed tasks, see [TODO-COMPLETED.md](./TODO-COMPLETED.md)
>
> This file focuses on **pending and future work** only.

**Last Updated**: 2024

---

## 📋 Current Status Summary

### ✅ Completed Features

- **Phase 1: Authentication** - ✅ Complete
- **Phase 2: Portfolio Management** - ✅ Complete
- **Phase 3: Production Infrastructure** - ✅ Mostly Complete
- **Settings Module** - ✅ Complete
- **Email Preferences** - ✅ Complete
- **Notification Preferences** - ✅ Complete
- **Global Exception Filter** - ✅ Complete
- **Request/Response Interceptors** - ✅ Complete
- **Rate Limiting (Redis Storage)** - ✅ Complete

See [TODO-COMPLETED.md](./TODO-COMPLETED.md) for full details.

---

## 🎯 Pending Tasks

### High Priority (Production Readiness)

#### Testing

- [ ] **Unit Tests**
  - [ ] Test AuthService methods
  - [ ] Test password hashing/verification
  - [ ] Test token generation
  - [ ] Test UsersService methods
  - [ ] Test Portfolio services
  - [ ] Test Queue services

- [ ] **Integration Tests**
  - [ ] Test register endpoint
  - [ ] Test login endpoint
  - [ ] Test refresh token endpoint
  - [ ] Test protected endpoints
  - [ ] Test portfolio CRUD endpoints
  - [ ] Test error scenarios

- [ ] **E2E Tests**
  - [ ] Test complete auth flow
  - [ ] Test token expiration
  - [ ] Test password reset flow
  - [ ] Test portfolio management flow

#### Documentation

- [ ] **API Documentation (Swagger/OpenAPI)**
  - [ ] Add Swagger/OpenAPI setup
  - [ ] Document all endpoints
  - [ ] Document request/response schemas
  - [ ] Document error responses
  - [ ] Add API versioning documentation

- [ ] **Code Documentation (JSDoc)**
  - [ ] Add JSDoc comments to queue services
  - [ ] Add JSDoc comments to WebSocket gateway
  - [ ] Add JSDoc comments to cron jobs
  - [ ] Add inline comments for complex logic
  - [ ] Document environment variables

---

### Medium Priority (Enhancement)

#### Error Handling

- [ ] **Custom Exceptions** (Optional - Low Priority)
  - **Current State**: NestJS built-in exceptions (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`) are used throughout the codebase and work perfectly with the global exception filter.
  - **Why Custom Exceptions?**: Only needed if you want to add:
    - Custom error codes (e.g., `EMAIL_ALREADY_EXISTS`, `USER_NOT_FOUND`)
    - Additional metadata (e.g., `errorCode`, `field`, `suggestions`)
    - Domain-specific error types
  - [ ] Create `common/exceptions/bad-request.exception.ts` (if custom error codes needed)
  - [ ] Create `common/exceptions/unauthorized.exception.ts` (if custom error codes needed)
  - [ ] Create `common/exceptions/forbidden.exception.ts` (if custom error codes needed)
  - [ ] Create `common/exceptions/not-found.exception.ts` (if custom error codes needed)
  - [ ] Create `common/exceptions/conflict.exception.ts` (if custom error codes needed)
  - **Note**: Current implementation is sufficient. Custom exceptions are only needed for enhanced error codes/metadata.

- [ ] **Error Messages**
  - [ ] Consistent error response format (✅ Already implemented via global filter)
  - [ ] User-friendly messages (✅ Partially done)
  - [ ] Include error codes for frontend handling
  - [ ] Don't leak sensitive information (✅ Already implemented)

#### Security & Performance

- [ ] **Body Size Limits** (Partially Complete)
  - [x] **File upload size limits** - ✅ **COMPLETED**
    - Configured in `config/configuration.ts`:
      - `maxFileSize`: 10MB default (configurable via `MAX_FILE_SIZE` env var)
      - `maxImageSize`: 5MB default (configurable via `MAX_IMAGE_SIZE` env var)
    - Validated in `FileUploadService.validateFile()`
    - Environment variables validated in `env.validation.ts`
  - [ ] **JSON body parser size limits** - Not configured
    - Currently uses Express defaults (100kb for JSON)
    - Should configure explicit limits in `main.ts` using `app.use(express.json({ limit: '10mb' }))`
    - Consider adding environment variable for configuration
  - [ ] **Request size validation middleware** - Not implemented
    - Add middleware to check `Content-Length` header before processing
    - Reject requests that exceed configured limits early
    - Return appropriate error response (413 Payload Too Large)

- [ ] **Rate Limiting Enhancements** (Mostly Complete)
  - [x] **Redis-based rate limiting** - ✅ **COMPLETED**
    - `ThrottlerRedisStorage` adapter created
    - Falls back to in-memory storage if Redis unavailable
    - Configured in `app.module.ts` using `ThrottlerModule.forRootAsync`
  - [x] **Different limits for different endpoints** - ✅ **COMPLETED**
    - Default: 10 requests per minute (configured in `app.module.ts`)
    - Public portfolio endpoints: 60 requests per minute (`@Throttle` on `PortfolioPublicController`)
    - Portfolio endpoints: 20 requests per minute (`@Throttle` on `PortfolioProjectsController`)
    - Password change: 5 requests per minute (`@Throttle` on `AuthController.changePassword`)
    - WebSocket rate limiting: Separate guard with configurable limits
  - [ ] **Review rate limiting configuration** (Optional)
    - Review if all endpoints have appropriate limits
    - Consider adding limits to other sensitive endpoints (e.g., account deletion, data export)
    - Document rate limit strategy

#### Features

- [ ] **Resume Upload Enhancement**
  - [ ] Current: Endpoint exists at `/api/v1/portfolio/profile/resume`
  - [ ] Could add: File validation, preview, download endpoint
  - [ ] Could add: Resume versioning/history

- [ ] **Public Portfolio API Response Format**
  - [ ] `portfolio-public.controller.ts` - ⚠️ Public API (may use different response format)
  - [ ] Consider standardizing with other endpoints

---

### Low Priority (Nice to Have)

#### Monitoring & Observability

- [ ] **Advanced Monitoring**
  - [ ] Add WebSocket connection metrics (optional - can be added later)
  - [ ] Add more detailed metrics and alerts
  - [ ] Add performance monitoring (APM)
  - [ ] Add distributed tracing

#### Database Optimization

- [ ] **Query Optimization**
  - [ ] Optimize queries with proper MongoDB aggregation (optional - current queries are efficient)
  - [ ] Add query performance monitoring
  - [ ] Add database query logging (development only)

#### Cron Job Enhancements

- [ ] **Cron Job Status Tracking**
  - [ ] Add cron job status tracking (optional - can be added later for monitoring)
  - [ ] Add cron job execution history UI
  - [ ] Add cron job failure alerts

#### Queue Enhancements

- [ ] **Queue Testing**
  - [ ] Add unit tests for queue producers
  - [ ] Add unit tests for queue processors
  - [ ] Add integration tests for queue flow

- [ ] **WebSocket Testing**
  - [ ] Add unit tests for WebSocket gateway
  - [ ] Add integration tests for WebSocket events

#### Additional Features

- [ ] **Token Blacklisting** (Optional)
  - [ ] Add token to blacklist if implementing token revocation later
  - [ ] Currently using stateless JWT (no blacklist needed)

- [ ] **Email Marketing/Weekly Digest**
  - [ ] Implement marketing email sending
  - [ ] Implement weekly digest email
  - [ ] Add email templates for marketing/digest

---

## 📝 Notes

### Architecture Decisions

- **Stateless JWT**: Tokens are self-contained, no database lookups needed for validation
- **Token Rotation**: New refresh token on each refresh prevents token reuse
- **Security**: Argon2 for passwords, JWT for tokens, rate limiting for brute force protection
- **Scalability**: Stateless approach allows horizontal scaling without shared session storage
- **Process Separation**: API, Worker, and Scheduler are separate processes for optimal resource usage

### Development Guidelines

- **TypeScript**: All code must be fully typed
- **Modular Structure**: Each feature should be in its own module
- **Environment Variables**: All configuration should come from `.env`
- **Best Practices**: Follow NestJS dependency injection and module patterns
- **Testing**: Write tests for critical paths (auth, portfolio, queue)
- **Documentation**: Document complex logic and API endpoints

### Future Considerations

- Consider adding Docker/Docker Compose for easier local development
- Consider adding CI/CD pipeline
- Consider adding automated deployment scripts
- Consider adding database migrations system
- Consider adding API rate limiting per user (beyond global limits)

---

## 🚀 Quick Reference

### Priority Order

1. **Testing** (High Priority) - Critical for production readiness
2. **API Documentation** (High Priority) - Improves developer experience
3. **Code Documentation** (Medium Priority) - Helps maintainability
4. **Enhancements** (Low Priority) - Nice to have features

### Completed Work

See [TODO-COMPLETED.md](./TODO-COMPLETED.md) for:

- Phase 1: Authentication (Complete)
- Phase 2: Portfolio Management (Complete)
- Phase 3: Production Infrastructure (Mostly Complete)
- Settings Module (Complete)
- All implemented features and modules

---

**Last Updated**: 01 Dec 2025
