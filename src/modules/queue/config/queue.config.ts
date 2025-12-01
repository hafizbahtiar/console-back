import { ConfigService } from '@nestjs/config';
import { Config } from '../../../config/config.interface';
import { BullModuleOptions } from '@nestjs/bull';

/**
 * Get Redis connection configuration for Bull queues
 */
export function getBullRedisConfig(
    configService: ConfigService<Config>,
): BullModuleOptions['redis'] {
    const redisConfig = configService.get('redis', { infer: true });

    if (!redisConfig) {
        throw new Error('Redis configuration not found');
    }

    return {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        retryStrategy: (times: number) => {
            if (times > 10) {
                return null; // Stop retrying after 10 attempts
            }
            // Exponential backoff: 100ms, 200ms, 400ms, ... up to 3000ms
            const delay = Math.min(times * 100, 3000);
            return delay;
        },
        maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
        enableReadyCheck: redisConfig.enableReadyCheck,
        enableOfflineQueue: redisConfig.enableOfflineQueue,
    };
}

/**
 * Default job options for all queues
 */
export const defaultJobOptions = {
    // Remove job after completion (keep failed jobs for debugging)
    removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
        count: 5000, // Keep last 5000 failed jobs
    },
    // Job attempts and backoff
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
        type: 'exponential' as const,
        delay: 2000, // Start with 2 second delay
    },
    // Timeout for job processing (30 seconds)
    timeout: 30000,
};

/**
 * Queue-specific configurations
 */
export const queueConfigs: Record<string, Partial<BullModuleOptions>> = {
    email: {
        defaultJobOptions: {
            ...defaultJobOptions,
            attempts: 5, // Email jobs get more retries
            backoff: {
                type: 'exponential' as const,
                delay: 5000, // Start with 5 second delay for emails
            },
            timeout: 60000, // 60 seconds timeout for email sending
        },
        settings: {
            // Process jobs concurrently
            maxStalledCount: 1, // Mark as stalled after 1 failed attempt
            retryProcessDelay: 5000, // Wait 5 seconds before retrying stalled jobs
        },
    },
};

