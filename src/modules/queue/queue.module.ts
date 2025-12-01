import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { Config } from '../../config/config.interface';
import { QueueNames } from './constants/queue-names.constant';
import { getBullRedisConfig, queueConfigs, defaultJobOptions } from './config/queue.config';
import { EmailQueueModule } from './queues/email/email-queue.module';

/**
 * Queue Module
 * 
 * Configures Bull queues with Redis connection.
 * This module is global so queues can be injected anywhere in the app.
 */
@Global()
@Module({
    imports: [
        ConfigModule,
        // Register all queues
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService<Config>) => {
                const redis = getBullRedisConfig(configService);

                return {
                    redis,
                    defaultJobOptions,
                };
            },
            inject: [ConfigService],
        }),
        // Register individual queues with their specific configurations
        BullModule.registerQueueAsync(
            ...Object.values(QueueNames).map((queueName) => ({
                name: queueName,
                imports: [ConfigModule],
                useFactory: (configService: ConfigService<Config>) => {
                    const redis = getBullRedisConfig(configService);
                    const queueConfig = queueConfigs[queueName] || {};

                    return {
                        redis,
                        defaultJobOptions: queueConfig.defaultJobOptions || defaultJobOptions,
                        settings: queueConfig.settings || {},
                    };
                },
                inject: [ConfigService],
            })),
        ),
        // Import email queue module (registers processor and producer)
        EmailQueueModule,
    ],
    exports: [BullModule, EmailQueueModule],
})
export class QueueModule { }

