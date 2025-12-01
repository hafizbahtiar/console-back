import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RedisService } from '../services/redis.service';
import { successResponse } from '../../../common/responses/response.util';
import { SuccessResponse } from '../../../common/responses/response.interface';

/**
 * Redis Health Check Controller
 * 
 * Provides health check endpoint for Redis connection
 * Useful for monitoring and debugging
 */
@Controller('health/redis')
export class RedisHealthController {
    constructor(private readonly redisService: RedisService) {}

    /**
     * Get Redis health status
     * Returns connection status and info
     */
    @Get()
    async getHealth(): Promise<SuccessResponse<{
        healthy: boolean;
        connected: boolean;
        status: string;
        host?: string;
        port?: number;
        timestamp: string;
    }>> {
        const isHealthy = await this.redisService.isHealthy();
        const info = await this.redisService.getInfo();

        return successResponse(
            {
                healthy: isHealthy,
                connected: info.connected,
                status: info.status,
                host: info.host,
                port: info.port,
                timestamp: new Date().toISOString(),
            },
            isHealthy ? 'Redis is healthy' : 'Redis is not healthy',
        );
    }

    /**
     * Get Redis health status (protected endpoint)
     * Requires authentication
     */
    @Get('protected')
    @UseGuards(JwtAuthGuard)
    async getHealthProtected(): Promise<SuccessResponse<{
        healthy: boolean;
        connected: boolean;
        status: string;
        host?: string;
        port?: number;
        timestamp: string;
    }>> {
        const isHealthy = await this.redisService.isHealthy();
        const info = await this.redisService.getInfo();

        return successResponse(
            {
                healthy: isHealthy,
                connected: info.connected,
                status: info.status,
                host: info.host,
                port: info.port,
                timestamp: new Date().toISOString(),
            },
            isHealthy ? 'Redis is healthy' : 'Redis is not healthy',
        );
    }
}

