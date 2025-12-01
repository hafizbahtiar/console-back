import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { RedisClientType } from 'redis';
import { QueueNames } from '../../queue/constants/queue-names.constant';
import { RedisService } from '../../redis/services/redis.service';

/**
 * Queue Metrics
 */
export interface QueueMetrics {
    name: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
    successRate: number;
    failureRate: number;
    throughput: number; // Jobs per minute (calculated from recent history)
}

/**
 * Redis Metrics
 */
export interface RedisMetrics {
    connected: boolean;
    memory: {
        used: number; // bytes
        peak: number; // bytes
        total: number; // bytes
        percentage: number;
    };
    connections: {
        connected: number;
        rejected: number;
    };
    commands: {
        processed: number;
        total: number;
    };
    keyspace: {
        keys: number;
        expires: number;
    };
    latency?: number; // milliseconds
}

/**
 * MongoDB Metrics
 */
export interface MongoMetrics {
    connected: boolean;
    connectionPool: {
        current: number;
        available: number;
        max: number;
        min: number;
    };
    collections: number;
    databases: string[];
    serverStatus?: {
        uptime: number; // seconds
        version: string;
    };
}

/**
 * API Metrics
 */
export interface ApiMetrics {
    requests: {
        total: number;
        successful: number;
        failed: number;
        rate: number; // requests per minute
    };
    responseTime: {
        average: number; // milliseconds
        p50: number; // milliseconds
        p95: number; // milliseconds
        p99: number; // milliseconds
    };
    errorRate: number; // percentage
}

/**
 * System Metrics Response
 */
export interface SystemMetrics {
    timestamp: string;
    queues: QueueMetrics[];
    redis: RedisMetrics;
    mongodb: MongoMetrics;
    api: ApiMetrics;
}

/**
 * Metrics Service
 * 
 * Collects system metrics from various sources (queues, Redis, MongoDB, API).
 */
@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);
    private readonly apiMetrics: {
        total: number;
        successful: number;
        failed: number;
        responseTimes: number[];
        lastReset: Date;
    } = {
            total: 0,
            successful: 0,
            failed: 0,
            responseTimes: [],
            lastReset: new Date(),
        };

    constructor(
        @InjectQueue(QueueNames.EMAIL)
        private readonly emailQueue: Queue,
        @InjectConnection()
        private readonly mongooseConnection: Connection,
        private readonly redisService: RedisService,
    ) {
        // Reset metrics every hour
        setInterval(() => {
            this.resetApiMetrics();
        }, 60 * 60 * 1000);
    }

    /**
     * Get all system metrics
     */
    async getAllMetrics(): Promise<SystemMetrics> {
        const [queueMetrics, redisMetrics, mongoMetrics, apiMetrics] = await Promise.all([
            this.getQueueMetrics(),
            this.getRedisMetrics(),
            this.getMongoMetrics(),
            this.getApiMetrics(),
        ]);

        return {
            timestamp: new Date().toISOString(),
            queues: queueMetrics,
            redis: redisMetrics,
            mongodb: mongoMetrics,
            api: apiMetrics,
        };
    }

    /**
     * Get queue metrics
     */
    private async getQueueMetrics(): Promise<QueueMetrics[]> {
        const metrics: QueueMetrics[] = [];

        try {
            // Email queue metrics
            const emailMetrics = await this.getQueueMetricsForQueue(this.emailQueue, QueueNames.EMAIL);
            metrics.push(emailMetrics);
        } catch (error) {
            this.logger.error('Failed to get queue metrics', error);
        }

        return metrics;
    }

    /**
     * Get metrics for a specific queue
     */
    private async getQueueMetricsForQueue(queue: Queue, queueName: string): Promise<QueueMetrics> {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
        ]);

        const total = waiting + active + completed + failed + delayed;
        const successRate = total > 0 ? (completed / total) * 100 : 0;
        const failureRate = total > 0 ? (failed / total) * 100 : 0;

        // Calculate throughput (jobs per minute) from recent completed jobs
        // This is a simplified calculation - in production, you'd track this over time
        let throughput = 0;
        try {
            const recentCompleted = await queue.getCompleted(0, 100);
            if (recentCompleted.length > 0) {
                const now = Date.now();
                const oneMinuteAgo = now - 60 * 1000;
                const recentJobs = recentCompleted.filter(
                    (job) => job.finishedOn && job.finishedOn > oneMinuteAgo,
                );
                throughput = recentJobs.length;
            }
        } catch (error) {
            // Ignore errors in throughput calculation
        }

        return {
            name: queueName,
            waiting,
            active,
            completed,
            failed,
            delayed,
            total,
            successRate: Math.round(successRate * 100) / 100,
            failureRate: Math.round(failureRate * 100) / 100,
            throughput,
        };
    }

    /**
     * Get Redis metrics
     */
    private async getRedisMetrics(): Promise<RedisMetrics> {
        const redisClient = this.redisService.getClient();
        if (!redisClient || !(await this.redisService.isHealthy())) {
            return {
                connected: false,
                memory: {
                    used: 0,
                    peak: 0,
                    total: 0,
                    percentage: 0,
                },
                connections: {
                    connected: 0,
                    rejected: 0,
                },
                commands: {
                    processed: 0,
                    total: 0,
                },
                keyspace: {
                    keys: 0,
                    expires: 0,
                },
            };
        }

        try {
            // Get Redis INFO command results
            const info = await redisClient.info('memory');
            const stats = await redisClient.info('stats');
            const keyspace = await redisClient.info('keyspace');

            // Parse memory info
            const memoryUsed = this.parseInfoValue(info, 'used_memory') || 0;
            const memoryPeak = this.parseInfoValue(info, 'used_memory_peak') || 0;
            const memoryTotal = this.parseInfoValue(info, 'total_system_memory') || memoryUsed;
            const memoryPercentage = memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0;

            // Parse stats
            const connectedClients = this.parseInfoValue(stats, 'connected_clients') || 0;
            const rejectedConnections = this.parseInfoValue(stats, 'rejected_connections') || 0;
            const totalCommandsProcessed = this.parseInfoValue(stats, 'total_commands_processed') || 0;

            // Parse keyspace
            const keys = this.parseKeyspaceKeys(keyspace);
            const expires = this.parseKeyspaceExpires(keyspace);

            // Measure latency
            const latencyStart = Date.now();
            await redisClient.ping();
            const latency = Date.now() - latencyStart;

            return {
                connected: true,
                memory: {
                    used: memoryUsed,
                    peak: memoryPeak,
                    total: memoryTotal,
                    percentage: Math.round(memoryPercentage * 100) / 100,
                },
                connections: {
                    connected: connectedClients,
                    rejected: rejectedConnections,
                },
                commands: {
                    processed: totalCommandsProcessed,
                    total: totalCommandsProcessed,
                },
                keyspace: {
                    keys,
                    expires,
                },
                latency,
            };
        } catch (error) {
            this.logger.error('Failed to get Redis metrics', error);
            return {
                connected: false,
                memory: {
                    used: 0,
                    peak: 0,
                    total: 0,
                    percentage: 0,
                },
                connections: {
                    connected: 0,
                    rejected: 0,
                },
                commands: {
                    processed: 0,
                    total: 0,
                },
                keyspace: {
                    keys: 0,
                    expires: 0,
                },
            };
        }
    }

    /**
     * Parse INFO command value
     */
    private parseInfoValue(info: string, key: string): number | null {
        const regex = new RegExp(`${key}:(\\d+)`, 'i');
        const match = info.match(regex);
        return match ? parseInt(match[1], 10) : null;
    }

    /**
     * Parse keyspace keys count
     */
    private parseKeyspaceKeys(keyspace: string): number {
        const regex = /keys=(\d+)/g;
        let total = 0;
        let match;
        while ((match = regex.exec(keyspace)) !== null) {
            total += parseInt(match[1], 10);
        }
        return total;
    }

    /**
     * Parse keyspace expires count
     */
    private parseKeyspaceExpires(keyspace: string): number {
        const regex = /expires=(\d+)/g;
        let total = 0;
        let match;
        while ((match = regex.exec(keyspace)) !== null) {
            total += parseInt(match[1], 10);
        }
        return total;
    }

    /**
     * Get MongoDB metrics
     */
    private async getMongoMetrics(): Promise<MongoMetrics> {
        try {
            const db = this.mongooseConnection.db;
            if (!db) {
                return {
                    connected: false,
                    connectionPool: {
                        current: 0,
                        available: 0,
                        max: 10,
                        min: 2,
                    },
                    collections: 0,
                    databases: [],
                };
            }

            const adminDb = db.admin();

            // Get connection pool stats
            const connectionState = this.mongooseConnection.readyState;
            const connected = connectionState === 1;

            // Get collections count
            const collections = await db.listCollections().toArray();
            const collectionsCount = collections.length;

            // Get database names
            const admin = db.admin();
            const databases = await admin.listDatabases();
            const databaseNames = databases.databases.map((d) => d.name);

            // Get server status (if available)
            let serverStatus: { uptime: number; version: string } | undefined;
            try {
                const status = await adminDb.serverStatus();
                serverStatus = {
                    uptime: status.uptime || 0,
                    version: status.version || 'unknown',
                };
            } catch (error) {
                // Server status might not be available
            }

            // Connection pool info (Mongoose doesn't expose this directly, so we estimate)
            const poolSize = 10; // From database.module.ts maxPoolSize
            const minPoolSize = 2; // From database.module.ts minPoolSize

            return {
                connected,
                connectionPool: {
                    current: connected ? poolSize : 0,
                    available: connected ? poolSize : 0,
                    max: poolSize,
                    min: minPoolSize,
                },
                collections: collectionsCount,
                databases: databaseNames,
                serverStatus,
            };
        } catch (error) {
            this.logger.error('Failed to get MongoDB metrics', error);
            return {
                connected: false,
                connectionPool: {
                    current: 0,
                    available: 0,
                    max: 10,
                    min: 2,
                },
                collections: 0,
                databases: [],
            };
        }
    }

    /**
     * Get API metrics
     */
    private getApiMetrics(): ApiMetrics {
        const { total, successful, failed, responseTimes } = this.apiMetrics;

        // Calculate rates (per minute)
        const timeSinceReset = (Date.now() - this.apiMetrics.lastReset.getTime()) / 1000 / 60; // minutes
        const rate = timeSinceReset > 0 ? total / timeSinceReset : 0;

        // Calculate error rate
        const errorRate = total > 0 ? (failed / total) * 100 : 0;

        // Calculate response time percentiles
        const sortedTimes = [...responseTimes].sort((a, b) => a - b);
        const average = sortedTimes.length > 0
            ? sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length
            : 0;
        const p50 = this.getPercentile(sortedTimes, 50);
        const p95 = this.getPercentile(sortedTimes, 95);
        const p99 = this.getPercentile(sortedTimes, 99);

        return {
            requests: {
                total,
                successful,
                failed,
                rate: Math.round(rate * 100) / 100,
            },
            responseTime: {
                average: Math.round(average * 100) / 100,
                p50: Math.round(p50 * 100) / 100,
                p95: Math.round(p95 * 100) / 100,
                p99: Math.round(p99 * 100) / 100,
            },
            errorRate: Math.round(errorRate * 100) / 100,
        };
    }

    /**
     * Get percentile from sorted array
     */
    private getPercentile(sortedArray: number[], percentile: number): number {
        if (sortedArray.length === 0) return 0;
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)] || 0;
    }

    /**
     * Record API request (called from middleware or interceptor)
     */
    recordApiRequest(success: boolean, responseTime: number) {
        this.apiMetrics.total++;
        if (success) {
            this.apiMetrics.successful++;
        } else {
            this.apiMetrics.failed++;
        }

        // Keep only last 1000 response times for percentile calculation
        this.apiMetrics.responseTimes.push(responseTime);
        if (this.apiMetrics.responseTimes.length > 1000) {
            this.apiMetrics.responseTimes.shift();
        }
    }

    /**
     * Reset API metrics
     */
    private resetApiMetrics() {
        this.apiMetrics.total = 0;
        this.apiMetrics.successful = 0;
        this.apiMetrics.failed = 0;
        this.apiMetrics.responseTimes = [];
        this.apiMetrics.lastReset = new Date();
    }
}

