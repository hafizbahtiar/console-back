import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { getProcessType } from './utils/process-type.util';

/**
 * Worker Process Entry Point
 * 
 * This process handles:
 * - Queue workers (Bull queue processors)
 * - Background job processing
 * 
 * Run with: PROCESS_TYPE=worker node dist/worker.main.js
 */
async function bootstrap() {
    const logger = new Logger('WorkerBootstrap');

    logger.log('🚀 Starting worker process...');
    logger.log(`📋 Process type: ${getProcessType()}`);

    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Worker processes don't need HTTP server
    // They only process queue jobs

    logger.log('✅ Worker process started successfully');
    logger.log('📦 Queue processors are ready to process jobs');

    // Keep the process alive
    process.on('SIGTERM', async () => {
        logger.log('⚠️  SIGTERM received, shutting down worker gracefully...');
        await app.close();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.log('⚠️  SIGINT received, shutting down worker gracefully...');
        await app.close();
        process.exit(0);
    });
}

bootstrap().catch((error) => {
    const logger = new Logger('WorkerBootstrap');
    logger.error('❌ Failed to start worker process', error.stack);
    process.exit(1);
});

