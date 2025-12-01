import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisClientType } from 'redis';

/**
 * ThrottlerStorageRecord interface
 * Matches the interface from @nestjs/throttler
 */
interface ThrottlerStorageRecord {
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
}

/**
 * Redis Storage for ThrottlerModule
 * 
 * Implements ThrottlerStorage interface to use Redis for rate limiting storage.
 * Falls back to in-memory storage if Redis is not available.
 */
export class ThrottlerRedisStorage implements ThrottlerStorage {
    private memoryStorage: Map<string, ThrottlerStorageRecord> = new Map();

    constructor(private readonly redisClient: RedisClientType | null) { }

    /**
     * Increment hit count for a key
     * This is the only method required by ThrottlerStorage interface
     */
    async increment(
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        throttlerName: string,
    ): Promise<ThrottlerStorageRecord> {
        const now = Date.now();
        const timeToExpire = now + ttl * 1000;

        if (!this.redisClient) {
            // Fallback to memory storage
            const record = this.memoryStorage.get(key);
            if (record) {
                // Check if record has expired
                if (now > record.timeToExpire) {
                    // Create new record
                    const newRecord: ThrottlerStorageRecord = {
                        totalHits: 1,
                        timeToExpire,
                        isBlocked: false,
                        timeToBlockExpire: 0,
                    };
                    this.memoryStorage.set(key, newRecord);
                    setTimeout(() => {
                        this.memoryStorage.delete(key);
                    }, ttl * 1000);
                    return newRecord;
                }
                // Increment existing record
                record.totalHits++;
                record.isBlocked = record.totalHits >= limit;
                if (record.isBlocked) {
                    record.timeToExpire = now + blockDuration * 1000;
                    record.timeToBlockExpire = now + blockDuration * 1000;
                }
                this.memoryStorage.set(key, record);
                return record;
            } else {
                // Create new record
                const newRecord: ThrottlerStorageRecord = {
                    totalHits: 1,
                    timeToExpire,
                    isBlocked: false,
                    timeToBlockExpire: 0,
                };
                this.memoryStorage.set(key, newRecord);
                setTimeout(() => {
                    this.memoryStorage.delete(key);
                }, ttl * 1000);
                return newRecord;
            }
        }

        try {
            const value = await this.redisClient.get(key);
            if (value) {
                const record = JSON.parse(value) as ThrottlerStorageRecord;
                // Check if record has expired
                if (now > record.timeToExpire) {
                    // Create new record
                    const newRecord: ThrottlerStorageRecord = {
                        totalHits: 1,
                        timeToExpire,
                        isBlocked: false,
                        timeToBlockExpire: 0,
                    };
                    await this.redisClient.setEx(key, ttl, JSON.stringify(newRecord));
                    return newRecord;
                }
                // Increment existing record
                record.totalHits++;
                record.isBlocked = record.totalHits >= limit;
                if (record.isBlocked) {
                    record.timeToExpire = now + blockDuration * 1000;
                    record.timeToBlockExpire = now + blockDuration * 1000;
                    await this.redisClient.setEx(key, Math.ceil(blockDuration), JSON.stringify(record));
                } else {
                    await this.redisClient.setEx(key, ttl, JSON.stringify(record));
                }
                return record;
            } else {
                // Create new record
                const newRecord: ThrottlerStorageRecord = {
                    totalHits: 1,
                    timeToExpire,
                    isBlocked: false,
                    timeToBlockExpire: 0,
                };
                await this.redisClient.setEx(key, ttl, JSON.stringify(newRecord));
                return newRecord;
            }
        } catch (error) {
            // If Redis fails, fallback to memory storage
            const record = this.memoryStorage.get(key);
            if (record && now <= record.timeToExpire) {
                record.totalHits++;
                record.isBlocked = record.totalHits >= limit;
                if (record.isBlocked) {
                    record.timeToExpire = now + blockDuration * 1000;
                    record.timeToBlockExpire = now + blockDuration * 1000;
                }
                this.memoryStorage.set(key, record);
                return record;
            } else {
                const newRecord: ThrottlerStorageRecord = {
                    totalHits: 1,
                    timeToExpire,
                    isBlocked: false,
                    timeToBlockExpire: 0,
                };
                this.memoryStorage.set(key, newRecord);
                setTimeout(() => {
                    this.memoryStorage.delete(key);
                }, ttl * 1000);
                return newRecord;
            }
        }
    }
}

