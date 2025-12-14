import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './modules/redis/services/redis.service';
import { successResponse } from './common/responses/response.util';
import type { SuccessResponse } from './common/responses/response.interface';
import type { HealthStatus } from './common/types/health.type';

/**
 * Application Health Check Controller
 * 
 * Provides comprehensive health check endpoints for monitoring
 * Checks database, Redis, and overall application status
 */
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Basic health check endpoint
   * Returns simple status information
   */
  @Get('health')
  basicHealth(): string {
    return 'OK';
  }

  /**
   * Comprehensive health check endpoint
   * Returns detailed status of all critical services
   */
  @Get('health/detailed')
  async detailedHealth(): Promise<SuccessResponse<HealthStatus>> {
    const startTime = Date.now();

    try {
      // Check Redis health
      const redisHealthy = await this.redisService.isHealthy();
      const redisInfo = await this.redisService.getInfo();

      // Check database health (MongoDB)
      const mongoose = await import('mongoose');
      const dbConnection = mongoose.default.connection;
      const dbHealthy = dbConnection.readyState === 1; // 1 = connected

      // Check environment
      const nodeEnv = this.configService.get<string>('nodeEnv') || 'unknown';
      const version = process.env.npm_package_version || 'unknown';

      // Overall health status
      const overallHealthy = dbHealthy && redisHealthy;

      const healthStatus: HealthStatus = {
        status: overallHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: nodeEnv,
        version,
        services: {
          database: {
            healthy: dbHealthy,
            status: dbHealthy ? 'connected' : 'disconnected',
            name: dbConnection.name || 'unknown',
            host: dbConnection.host || 'unknown',
          },
          redis: {
            healthy: redisHealthy,
            connected: redisInfo.connected,
            status: redisInfo.status,
            host: redisInfo.host,
            port: redisInfo.port,
          },
        },
        responseTime: Date.now() - startTime,
      };

      const message = overallHealthy
        ? 'All services are healthy'
        : 'Some services are experiencing issues';

      this.logger.log(`Health check completed: ${healthStatus.status} (${Date.now() - startTime}ms)`);

      return successResponse(healthStatus, message);
    } catch (error) {
      this.logger.error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      const errorStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.configService.get<string>('nodeEnv') || 'unknown',
        version: process.env.npm_package_version || 'unknown',
        services: {
          database: {
            healthy: false,
            status: 'error',
            name: 'unknown',
            host: 'unknown',
          },
          redis: {
            healthy: false,
            connected: false,
            status: 'error',
            host: undefined,
            port: undefined,
          },
        },
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return successResponse(errorStatus, 'Health check failed', 500);
    }
  }

  /**
   * Ready check endpoint
   * Returns true if the application is ready to accept traffic
   */
  @Get('health/ready')
  async readyCheck(): Promise<SuccessResponse<{ ready: boolean; message: string }>> {
    try {
      // Check database connection
      const mongoose = await import('mongoose');
      const dbConnection = mongoose.default.connection;
      const dbReady = dbConnection.readyState === 1;

      // Check Redis connection
      const redisReady = await this.redisService.isHealthy();

      const isReady = dbReady && redisReady;

      if (isReady) {
        return successResponse(
          { ready: true, message: 'Application is ready to accept traffic' },
          'Ready'
        );
      } else {
        return successResponse(
          { ready: false, message: 'Application is not ready - some services are unavailable' },
          'Not ready',
          503 // Service Unavailable
        );
      }
    } catch (error) {
      this.logger.error(`Ready check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return successResponse(
        {
          ready: false,
          message: 'Application is not ready - health check failed'
        },
        'Not ready',
        503
      );
    }
  }

  /**
   * Live check endpoint
   * Returns true if the application process is running
   */
  @Get('health/live')
  liveCheck(): SuccessResponse<{ live: boolean; timestamp: string }> {
    return successResponse(
      {
        live: true,
        timestamp: new Date().toISOString()
      },
      'Application is live'
    );
  }
}
