import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { getProcessType } from './utils/process-type.util';

/**
 * Scheduler Process Entry Point
 * 
 * This process handles:
 * - Cron jobs (scheduled tasks)
 * - Periodic maintenance tasks
 * 
 * Run with: PROCESS_TYPE=scheduler node dist/scheduler.main.js
 */
async function bootstrap() {
    const logger = new Logger('SchedulerBootstrap');

    logger.log('🚀 Starting scheduler process...');
    logger.log(`📋 Process type: ${getProcessType()}`);

    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Scheduler processes don't need HTTP server
    // They only run cron jobs

    logger.log('✅ Scheduler process started successfully');
    logger.log('⏰ Cron jobs are active');

    // Keep the process alive
    process.on('SIGTERM', async () => {
        logger.log('⚠️  SIGTERM received, shutting down scheduler gracefully...');
        await app.close();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.log('⚠️  SIGINT received, shutting down scheduler gracefully...');
        await app.close();
        process.exit(0);
    });
}

bootstrap().catch((error) => {
    const logger = new Logger('SchedulerBootstrap');
    logger.error('❌ Failed to start scheduler process', error.stack);
    process.exit(1);
});

