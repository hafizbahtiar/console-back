import { Controller, Get, Post, Delete, Req, Res, UseGuards, All, Logger, Param, Query, NotFoundException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QueueNames } from '../../queue/constants/queue-names.constant';
import { BullBoardService } from '../services/bull-board.service';
import { CronJobTrackerService } from '../services/cron-job-tracker.service';
import { MetricsService } from '../services/metrics.service';
import { RedisService } from '../../redis/services/redis.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { successResponse } from '../../../common/responses/response.util';

/**
 * Admin Controller
 * 
 * Provides admin-only endpoints including queue dashboard.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    private readonly logger = new Logger(AdminController.name);

    constructor(
        @InjectQueue(QueueNames.EMAIL)
        private readonly emailQueue: Queue,
        private readonly bullBoardService: BullBoardService,
        private readonly cronJobTracker: CronJobTrackerService,
        private readonly metricsService: MetricsService,
        private readonly redisService: RedisService,
        @InjectConnection()
        private readonly mongooseConnection: Connection,
    ) { }

    /**
     * Queue Dashboard UI Root
     * GET /api/v1/admin/queues
     * Redirects to Bull Board dashboard
     */
    @Get('queues')
    async queueDashboardRoot(@Req() req: Request, @Res() res: Response) {
        // Redirect to Bull Board UI
        res.redirect('/api/v1/admin/queues/ui');
    }

    /**
     * Queue Dashboard - Catch all routes for Bull Board
     * GET /api/v1/admin/queues/*
     * 
     * This route handles all Bull Board UI and API requests.
     * Bull Board provides a web interface for monitoring and managing queues.
     */
    @All('queues/*')
    async queueDashboard(@Req() req: Request, @Res() res: Response) {
        // Bull Board handles all routes under /admin/queues/*
        // The adapter's router will handle the request
        const router = this.bullBoardService.getRouter();
        router(req, res);
    }

    /**
     * Queue Statistics
     * GET /api/v1/admin/queues/stats
     */
    @Get('queues/stats')
    async getQueueStats() {
        const stats = await Promise.all([
            this.getEmailQueueStats(),
            // Add more queue stats here as queues are added
        ]);

        return successResponse(
            {
                queues: {
                    email: stats[0],
                    // Add more queue stats here
                },
                summary: {
                    totalWaiting: stats.reduce((sum, s) => sum + s.waiting, 0),
                    totalActive: stats.reduce((sum, s) => sum + s.active, 0),
                    totalCompleted: stats.reduce((sum, s) => sum + s.completed, 0),
                    totalFailed: stats.reduce((sum, s) => sum + s.failed, 0),
                    totalDelayed: stats.reduce((sum, s) => sum + s.delayed, 0),
                },
            },
            'Queue statistics retrieved successfully',
        );
    }

    /**
     * Get email queue statistics
     */
    private async getEmailQueueStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.emailQueue.getWaitingCount(),
            this.emailQueue.getActiveCount(),
            this.emailQueue.getCompletedCount(),
            this.emailQueue.getFailedCount(),
            this.emailQueue.getDelayedCount(),
        ]);

        return {
            name: QueueNames.EMAIL,
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed,
        };
    }

    /**
     * Retry a failed job
     * POST /api/v1/admin/queues/:queueName/jobs/:jobId/retry
     */
    @Post('queues/:queueName/jobs/:jobId/retry')
    async retryJob(
        @Param('queueName') queueName: string,
        @Param('jobId') jobId: string,
    ) {
        // Get the appropriate queue based on queueName
        const queue = this.getQueueByName(queueName);
        if (!queue) {
            throw new NotFoundException(`Queue '${queueName}' not found`);
        }

        const job = await queue.getJob(jobId);
        if (!job) {
            throw new NotFoundException(`Job '${jobId}' not found`);
        }

        await job.retry();
        this.logger.log(`Retried job ${jobId} in queue ${queueName}`);

        return successResponse(
            { jobId, queueName },
            `Job ${jobId} has been retried`,
        );
    }

    /**
     * Clean completed/failed jobs from a queue
     * DELETE /api/v1/admin/queues/:queueName/jobs/clean
     */
    @Delete('queues/:queueName/jobs/clean')
    async cleanJobs(
        @Param('queueName') queueName: string,
        @Query('status') status: 'completed' | 'failed' | 'all' = 'completed',
        @Query('grace') grace: number = 1000 * 60 * 60 * 24, // Default: 24 hours
    ) {
        const queue = this.getQueueByName(queueName);
        if (!queue) {
            throw new NotFoundException(`Queue '${queueName}' not found`);
        }

        let cleaned = 0;
        if (status === 'completed' || status === 'all') {
            // Clean completed jobs older than grace period, limit to 1000 jobs
            // queue.clean(graceMs, limit, type)
            const completed = await (queue.clean as any)(grace, 1000, 'completed');
            cleaned += completed.length;
        }
        if (status === 'failed' || status === 'all') {
            // Clean failed jobs older than grace period, limit to 1000 jobs
            const failed = await (queue.clean as any)(grace, 1000, 'failed');
            cleaned += failed.length;
        }

        this.logger.log(`Cleaned ${cleaned} ${status} jobs from queue ${queueName}`);

        return successResponse(
            { queueName, status, cleaned },
            `Cleaned ${cleaned} ${status} jobs from queue ${queueName}`,
        );
    }

    /**
     * Get failed jobs for a queue
     * GET /api/v1/admin/queues/:queueName/jobs/failed
     */
    @Get('queues/:queueName/jobs/failed')
    async getFailedJobs(
        @Param('queueName') queueName: string,
        @Query('start') start: number = 0,
        @Query('end') end: number = 20,
    ) {
        const queue = this.getQueueByName(queueName);
        if (!queue) {
            throw new NotFoundException(`Queue '${queueName}' not found`);
        }

        const failed = await queue.getFailed(start, end);
        const failedJobs = await Promise.all(
            failed.map(async (job) => ({
                id: job.id,
                name: job.name,
                data: job.data,
                failedReason: job.failedReason,
                timestamp: job.timestamp,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
            })),
        );

        return successResponse(
            {
                jobs: failedJobs,
                total: await queue.getFailedCount(),
            },
            'Failed jobs retrieved successfully',
        );
    }

    /**
     * Get job history for a queue
     * GET /api/v1/admin/queues/:queueName/jobs/history
     */
    @Get('queues/:queueName/jobs/history')
    async getJobHistory(
        @Param('queueName') queueName: string,
        @Query('status') status: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed' = 'completed',
        @Query('start') start: number = 0,
        @Query('end') end: number = 20,
    ) {
        const queue = this.getQueueByName(queueName);
        if (!queue) {
            throw new NotFoundException(`Queue '${queueName}' not found`);
        }

        let jobs: any[] = [];
        let total = 0;

        switch (status) {
            case 'completed':
                jobs = await queue.getCompleted(start, end);
                total = await queue.getCompletedCount();
                break;
            case 'failed':
                jobs = await queue.getFailed(start, end);
                total = await queue.getFailedCount();
                break;
            case 'active':
                jobs = await queue.getActive(start, end);
                total = await queue.getActiveCount();
                break;
            case 'waiting':
                jobs = await queue.getWaiting(start, end);
                total = await queue.getWaitingCount();
                break;
            case 'delayed':
                jobs = await queue.getDelayed(start, end);
                total = await queue.getDelayedCount();
                break;
        }

        const jobHistory = await Promise.all(
            jobs.map(async (job) => ({
                id: job.id,
                name: job.name,
                data: job.data,
                failedReason: job.failedReason,
                timestamp: job.timestamp,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                attemptsMade: job.attemptsMade,
            })),
        );

        return successResponse(
            {
                jobs: jobHistory,
                total,
                status,
            },
            'Job history retrieved successfully',
        );
    }

    /**
     * Get all cron job statuses
     * GET /api/v1/admin/cron-jobs
     */
    @Get('cron-jobs')
    async getCronJobStatuses() {
        const statuses = this.cronJobTracker.getAllJobStatuses();
        return successResponse(
            { jobs: statuses },
            'Cron job statuses retrieved successfully',
        );
    }

    /**
     * Get status for a specific cron job
     * GET /api/v1/admin/cron-jobs/:jobName
     */
    @Get('cron-jobs/:jobName')
    async getCronJobStatus(@Param('jobName') jobName: string) {
        const status = this.cronJobTracker.getJobStatus(jobName);
        if (!status) {
            throw new NotFoundException(`Cron job '${jobName}' not found`);
        }

        return successResponse(
            status,
            'Cron job status retrieved successfully',
        );
    }

    /**
     * Get execution history for a cron job
     * GET /api/v1/admin/cron-jobs/:jobName/history
     */
    @Get('cron-jobs/:jobName/history')
    async getCronJobHistory(
        @Param('jobName') jobName: string,
        @Query('limit') limit: number = 50,
    ) {
        const status = this.cronJobTracker.getJobStatus(jobName);
        if (!status) {
            throw new NotFoundException(`Cron job '${jobName}' not found`);
        }

        const history = this.cronJobTracker.getJobHistory(jobName, limit);
        return successResponse(
            {
                jobName,
                history,
                total: history.length,
            },
            'Cron job execution history retrieved successfully',
        );
    }

    /**
     * Get system health status
     * GET /api/v1/admin/health
     */
    @Get('health')
    async getSystemHealth() {
        const timestamp = new Date().toISOString();

        // Check Redis health
        let redisHealth: any;
        try {
            const redisInfo = await this.redisService.getInfo();
            const isHealthy = await this.redisService.isHealthy();
            redisHealth = {
                status: isHealthy ? 'healthy' : (redisInfo.connected ? 'warning' : 'error'),
                message: isHealthy ? 'Redis is healthy' : (redisInfo.connected ? 'Redis connected but unhealthy' : 'Redis is not connected'),
                timestamp,
                connected: redisInfo.connected,
                healthy: isHealthy,
                host: redisInfo.host,
                port: redisInfo.port,
            };
        } catch (error) {
            redisHealth = {
                status: 'error',
                message: 'Redis health check failed',
                timestamp,
                connected: false,
                healthy: false,
            };
        }

        // Check MongoDB health
        let mongodbHealth: any;
        try {
            const connectionState = this.mongooseConnection.readyState;
            const connected = connectionState === 1; // 1 = connected
            const dbName = this.mongooseConnection.name || 'unknown';

            mongodbHealth = {
                status: connected ? 'healthy' : 'error',
                message: connected ? `MongoDB connected to ${dbName}` : 'MongoDB is not connected',
                timestamp,
                connected,
                database: connected ? dbName : undefined,
            };
        } catch (error) {
            mongodbHealth = {
                status: 'error',
                message: 'MongoDB health check failed',
                timestamp,
                connected: false,
            };
        }

        // API is healthy if we can respond
        const apiHealth = {
            status: 'healthy' as const,
            message: 'API server is responding',
            timestamp,
        };

        return successResponse(
            {
                api: apiHealth,
                redis: redisHealth,
                mongodb: mongodbHealth,
            },
            'System health retrieved successfully',
        );
    }

    /**
     * Get system metrics
     * GET /api/v1/admin/metrics
     */
    @Get('metrics')
    async getSystemMetrics() {
        const metrics = await this.metricsService.getAllMetrics();
        return successResponse(
            metrics,
            'System metrics retrieved successfully',
        );
    }

    /**
     * Helper method to get queue by name
     */
    private getQueueByName(queueName: string): Queue | null {
        // For now, only email queue is available
        // This can be extended to support multiple queues
        if (queueName === QueueNames.EMAIL) {
            return this.emailQueue;
        }
        return null;
    }
}

