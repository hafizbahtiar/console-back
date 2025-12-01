import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './controllers/admin.controller';
import { BullBoardService } from './services/bull-board.service';
import { CronJobTrackerService } from './services/cron-job-tracker.service';
import { MetricsService } from './services/metrics.service';
import { QueueModule } from '../queue/queue.module';
import { RedisModule } from '../redis/redis.module';

/**
 * Admin Module
 * 
 * Provides admin-only features like queue dashboard, system monitoring, etc.
 * 
 * Note: This module is loaded in both API and Scheduler processes.
 * - In API process: All features including AdminController are available
 * - In Scheduler process: Only CronJobTrackerService is used (no controller)
 */
@Module({
    imports: [
        ConfigModule,
        ScheduleModule,
        QueueModule,
        MongooseModule,
        RedisModule, // RedisModule is Global, but explicit import for clarity
    ],
    controllers: [AdminController], // Controller only used in API process
    providers: [BullBoardService, CronJobTrackerService, MetricsService],
    exports: [BullBoardService, CronJobTrackerService, MetricsService],
})
export class AdminModule { }

