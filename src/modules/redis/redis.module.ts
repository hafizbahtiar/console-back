import { Module, Global, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { Config } from '../../config/config.interface';
import { RedisService } from './services/redis.service';
import { RedisHealthController } from './controllers/redis-health.controller';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService<Config>) => {
                const logger = new Logger('RedisModule');
                const redisConfig = configService.get('redis', { infer: true });

                if (!redisConfig) {
                    logger.warn('Redis configuration not found, Redis features will be disabled');
                    return null;
                }

                const clientOptions: RedisClientOptions = {
                    socket: {
                        host: redisConfig.host,
                        port: redisConfig.port,
                        reconnectStrategy: (retries: number) => {
                            if (retries > 10) {
                                logger.error('Redis reconnection failed after 10 attempts');
                                return new Error('Redis reconnection limit exceeded');
                            }
                            const delay = Math.min(retries * 100, 3000);
                            logger.warn(`Redis reconnecting... (attempt ${retries}, delay: ${delay}ms)`);
                            return delay;
                        },
                    },
                    password: redisConfig.password,
                    database: redisConfig.db,
                };

                const client = createClient(clientOptions) as RedisClientType;

                // Event listeners
                client.on('error', (err) => {
                    logger.error(`Redis Client Error: ${err.message}`, err.stack);
                });

                client.on('connect', () => {
                    logger.log('🔄 Connecting to Redis...');
                });

                client.on('ready', () => {
                    logger.log(`✅ Redis connected successfully (${redisConfig.host}:${redisConfig.port})`);
                });

                client.on('reconnecting', () => {
                    logger.warn('🔄 Redis reconnecting...');
                });

                client.on('end', () => {
                    logger.warn('⚠️  Redis connection ended');
                });

                // Connect with retry logic
                try {
                    await client.connect();
                    logger.log('✅ Redis client initialized successfully');
                } catch (error) {
                    logger.error(`❌ Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    // Don't throw - allow app to start without Redis (graceful degradation)
                    // In production, you might want to throw here
                    if (process.env.NODE_ENV === 'production') {
                        logger.error('Redis is required in production, but connection failed');
                    }
                }

                return client;
            },
            inject: [ConfigService],
        },
        RedisService,
    ],
    controllers: [RedisHealthController],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisModule.name);

    constructor(private configService: ConfigService<Config>) { }

    async onModuleInit() {
        // Module initialization
        this.logger.log('Redis module initialized');
    }

    async onModuleDestroy() {
        // Cleanup on module destroy
        this.logger.log('Redis module destroyed');
    }
}

