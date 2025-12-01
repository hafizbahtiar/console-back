import { Injectable, Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);

    constructor(
        @Inject('REDIS_CLIENT')
        private readonly redisClient: RedisClientType | null,
    ) { }

    /**
     * Get Redis client instance
     */
    getClient(): RedisClientType | null {
        return this.redisClient;
    }

    /**
     * Check if Redis is connected and available
     */
    async isHealthy(): Promise<boolean> {
        if (!this.redisClient) {
            return false;
        }

        try {
            // Ping Redis to check connection
            const result = await this.redisClient.ping();
            return result === 'PONG';
        } catch (error) {
            this.logger.warn(`Redis health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }

    /**
     * Get Redis connection info
     */
    async getInfo(): Promise<{
        connected: boolean;
        status: string;
        host?: string;
        port?: number;
    }> {
        if (!this.redisClient) {
            return {
                connected: false,
                status: 'not_configured',
            };
        }

        try {
            const isHealthy = await this.isHealthy();
            const socket = (this.redisClient as any).socket;

            return {
                connected: isHealthy,
                status: isHealthy ? 'connected' : 'disconnected',
                host: socket?.options?.host,
                port: socket?.options?.port,
            };
        } catch (error) {
            return {
                connected: false,
                status: 'error',
            };
        }
    }

    /**
     * Set a key-value pair with optional expiration
     */
    async set(key: string, value: string, expirationSeconds?: number): Promise<boolean> {
        if (!this.redisClient) {
            this.logger.warn('Redis client not available, set operation skipped');
            return false;
        }

        try {
            if (expirationSeconds) {
                await this.redisClient.setEx(key, expirationSeconds, value);
            } else {
                await this.redisClient.set(key, value);
            }
            return true;
        } catch (error) {
            this.logger.error(`Redis set error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }

    /**
     * Get a value by key
     */
    async get(key: string): Promise<string | null> {
        if (!this.redisClient) {
            this.logger.warn('Redis client not available, get operation skipped');
            return null;
        }

        try {
            return await this.redisClient.get(key);
        } catch (error) {
            this.logger.error(`Redis get error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    /**
     * Delete a key
     */
    async del(key: string): Promise<boolean> {
        if (!this.redisClient) {
            this.logger.warn('Redis client not available, delete operation skipped');
            return false;
        }

        try {
            const result = await this.redisClient.del(key);
            return result > 0;
        } catch (error) {
            this.logger.error(`Redis delete error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }

    /**
     * Check if a key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!this.redisClient) {
            return false;
        }

        try {
            const result = await this.redisClient.exists(key);
            return result > 0;
        } catch (error) {
            this.logger.error(`Redis exists error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }

    /**
     * Set expiration on a key
     */
    async expire(key: string, seconds: number): Promise<boolean> {
        if (!this.redisClient) {
            return false;
        }

        try {
            const result = await this.redisClient.expire(key, seconds);
            return result === 1; // 1 if timeout was set, 0 if key doesn't exist
        } catch (error) {
            this.logger.error(`Redis expire error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }

    /**
     * Cleanup on module destroy
     */
    async onModuleDestroy() {
        if (this.redisClient) {
            try {
                await this.redisClient.quit();
                this.logger.log('Redis client disconnected');
            } catch (error) {
                this.logger.error(`Error disconnecting Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
}

