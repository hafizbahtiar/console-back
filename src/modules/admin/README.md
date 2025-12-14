# Admin Module

## Overview

The Admin Module provides administrative functionality for the Console application, including system monitoring, queue management, and administrative tools. This module is designed to be used by system administrators and developers for managing and monitoring the application.

## Features

### 1. Queue Management Dashboard

- **Bull Board Integration**: Web-based UI for monitoring Bull queues (email, background jobs)
- **Queue Statistics**: Real-time statistics for waiting, active, completed, failed, and delayed jobs
- **Job Management**: Retry failed jobs, clean completed/failed jobs, view job history
- **Multi-Queue Support**: Extensible to support multiple queue types

### 2. Cron Job Monitoring

- **Job Status Tracking**: Monitor execution status of all scheduled cron jobs
- **Execution History**: Track job execution history with success/failure rates
- **Next Execution Prediction**: Calculate and display next execution times
- **Job Control**: Enable/disable jobs based on configuration

### 3. System Health Monitoring

- **Database Health**: MongoDB connection status and database information
- **Redis Health**: Redis connection and health status
- **API Health**: API server responsiveness
- **Real-time Metrics**: System performance metrics

### 4. Administrative Tools

- **Job Retry**: Manually retry failed jobs from any queue
- **Queue Cleanup**: Clean old completed/failed jobs to prevent queue bloat
- **System Diagnostics**: Comprehensive system health checks

## Module Structure

```
src/modules/admin/
├── admin.module.ts              # Main module configuration
├── controllers/
│   └── admin.controller.ts      # Admin API endpoints
├── services/
│   ├── bull-board.service.ts    # Bull Board dashboard setup
│   ├── cron-job-tracker.service.ts  # Cron job monitoring
│   └── metrics.service.ts        # System metrics collection
└── README.md                    # This documentation
```

## Key Components

### AdminController

Provides RESTful endpoints for administrative operations:

- `GET /admin/queues` - Queue dashboard UI
- `GET /admin/queues/stats` - Queue statistics
- `POST /admin/queues/:queueName/jobs/:jobId/retry` - Retry failed job
- `DELETE /admin/queues/:queueName/jobs/clean` - Clean old jobs
- `GET /admin/queues/:queueName/jobs/failed` - View failed jobs
- `GET /admin/queues/:queueName/jobs/history` - Job history
- `GET /admin/cron-jobs` - All cron job statuses
- `GET /admin/cron-jobs/:jobName` - Specific cron job status
- `GET /admin/cron-jobs/:jobName/history` - Cron job execution history
- `GET /admin/health` - System health status
- `GET /admin/metrics` - System metrics

### BullBoardService

Configures and provides the Bull Board dashboard for queue monitoring:

- Sets up Express adapter for Bull Board
- Registers available queues
- Provides router for mounting in main application

### CronJobTrackerService

Tracks and monitors cron job executions:

- Maintains execution history in memory
- Calculates success/failure rates
- Predicts next execution times
- Provides job status information

### MetricsService

Collects and provides system metrics for monitoring.

## Authentication & Authorization

All admin endpoints require JWT authentication with the `JwtAuthGuard`. The module uses higher throttle limits (1000 requests per minute) for admin endpoints since they are internal tools.

## Configuration

The module integrates with several other modules:

- **QueueModule**: For Bull queue management
- **RedisModule**: For Redis operations (global module)
- **ConfigModule**: For configuration management
- **ScheduleModule**: For cron job functionality
- **MongooseModule**: For database operations

## Usage Examples

### Get Queue Statistics

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/admin/queues/stats
```

### Retry Failed Job

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/admin/queues/email/jobs/123/retry
```

### View System Health

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/admin/health
```

### Monitor Cron Jobs

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/v1/admin/cron-jobs
```

## Development Notes

- The module is designed to work in both API and Scheduler processes
- Bull Board router is mounted in main.ts with authentication middleware
- Cron job tracking maintains execution history in memory (not persisted)
- All admin endpoints include comprehensive logging for debugging

## Security Considerations

- All endpoints require valid JWT authentication
- Higher throttle limits for admin endpoints (1000/minute vs 10/minute for public)
- Input validation for all parameters
- Proper error handling to avoid information leakage

## Future Enhancements

- Support for additional queue types
- Persistent storage for cron job history
- Enhanced metrics collection
- User-based access control for different admin levels
- Integration with external monitoring systems
