import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../../config/config.interface';

/**
 * WebSocket Rate Limit Guard
 * 
 * Implements rate limiting for WebSocket connections and events.
 * Tracks message frequency per user and disconnects if limit exceeded.
 */
@Injectable()
export class WsRateLimitGuard implements CanActivate {
    private readonly logger = new Logger(WsRateLimitGuard.name);

    // Track message counts per user (userId -> { count, resetTime })
    private readonly userMessageCounts = new Map<string, { count: number; resetTime: number }>();

    // Configuration
    private readonly maxMessagesPerMinute: number;
    private readonly maxMessagesPerHour: number;
    private readonly windowMs: number = 60000; // 1 minute

    constructor(private readonly configService: ConfigService<Config>) {
        // Get rate limit config from environment or use defaults
        this.maxMessagesPerMinute = parseInt(
            process.env.WS_RATE_LIMIT_PER_MINUTE || '30',
            10,
        );
        this.maxMessagesPerHour = parseInt(
            process.env.WS_RATE_LIMIT_PER_HOUR || '500',
            10,
        );
    }

    canActivate(context: ExecutionContext): boolean {
        const client: Socket = context.switchToWs().getClient();
        const user = client.data.user;

        if (!user) {
            // If no user, allow (authentication guard should handle this)
            return true;
        }

        const userId = user.userId;
        const now = Date.now();

        // Get or initialize user's message count
        let userCount = this.userMessageCounts.get(userId);

        if (!userCount || now > userCount.resetTime) {
            // Reset window
            userCount = {
                count: 0,
                resetTime: now + this.windowMs,
            };
            this.userMessageCounts.set(userId, userCount);
        }

        // Increment count
        userCount.count++;

        // Check rate limit
        if (userCount.count > this.maxMessagesPerMinute) {
            this.logger.warn(
                `Rate limit exceeded for user ${user.email} (${userId}): ${userCount.count} messages in window`,
            );

            // Emit rate limit error to client
            client.emit('rate_limit_error', {
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                message: `You have exceeded the rate limit of ${this.maxMessagesPerMinute} messages per minute. Please slow down.`,
                timestamp: new Date(),
            });

            // Disconnect client after a short delay
            setTimeout(() => {
                client.disconnect(true);
            }, 1000);

            return false;
        }

        return true;
    }

    /**
     * Clean up old entries periodically
     */
    cleanup() {
        const now = Date.now();
        for (const [userId, count] of this.userMessageCounts.entries()) {
            if (now > count.resetTime) {
                this.userMessageCounts.delete(userId);
            }
        }
    }
}

