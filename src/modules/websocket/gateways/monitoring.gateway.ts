import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards, UseFilters } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../guards/ws-jwt-auth.guard';
import { WsExceptionFilter } from '../filters/ws-exception.filter';
import { GetWsUser } from '../decorators/get-ws-user.decorator';
import { MetricsService } from '../../admin/services/metrics.service';
import { RedisService } from '../../redis/services/redis.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Monitoring Gateway
 *
 * Provides real-time monitoring data for admin dashboard:
 * - System health metrics
 * - Queue statistics
 * - Redis metrics
 * - MongoDB metrics
 * - API performance metrics
 */
@WebSocketGateway({
    namespace: '/monitoring',
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
    },
})
@UseGuards(WsJwtAuthGuard)
@UseFilters(WsExceptionFilter)
export class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MonitoringGateway.name);

    // Track connected admin clients
    private readonly adminClients: Set<string> = new Set();

    // Broadcast interval
    private broadcastInterval: NodeJS.Timeout | null = null;

    constructor(
        private readonly metricsService: MetricsService,
        private readonly redisService: RedisService,
        @InjectConnection()
        private readonly mongooseConnection: Connection,
    ) { }

    async handleConnection(client: Socket, ...args: any[]) {
        const user = client.data?.user;
        this.logger.log(`Client connected: ${client.id}, user: ${user?.email || 'unknown'}`);

        // Only allow admin/owner users
        if (!user || user.role !== 'owner') {
            this.logger.warn(`Non-admin user attempted to connect: ${user?.email || 'unknown'}`);
            client.disconnect();
            return;
        }

        this.adminClients.add(client.id);

        // Send initial data
        try {
            await this.sendInitialData(client);
        } catch (error) {
            this.logger.error(`Failed to send initial data to ${client.id}:`, error);
        }

        // Start broadcasting if this is the first admin client
        if (this.adminClients.size === 1) {
            this.startBroadcasting();
        }
    }

    async handleDisconnect(client: Socket) {
        const user = client.data?.user;
        this.logger.log(`Client disconnected: ${client.id}, user: ${user?.email || 'unknown'}`);

        this.adminClients.delete(client.id);

        // Stop broadcasting if no more admin clients
        if (this.adminClients.size === 0) {
            this.stopBroadcasting();
        }
    }

    /**
     * Send initial monitoring data to a newly connected client
     */
    private async sendInitialData(client: Socket) {
        try {
            const [systemHealth, systemMetrics] = await Promise.all([
                this.getSystemHealth(),
                this.metricsService.getAllMetrics(),
            ]);

            client.emit('monitoring:initial', {
                systemHealth,
                systemMetrics,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error(`Failed to send initial data:`, error);
            client.emit('monitoring:error', {
                message: 'Failed to load initial monitoring data',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Start broadcasting monitoring data to all connected admin clients
     */
    private startBroadcasting() {
        this.logger.log('Starting monitoring broadcast (30s interval)');

        this.broadcastInterval = setInterval(async () => {
            if (this.adminClients.size === 0) {
                this.stopBroadcasting();
                return;
            }

            try {
                const [systemHealth, systemMetrics] = await Promise.all([
                    this.getSystemHealth(),
                    this.metricsService.getAllMetrics(),
                ]);

                // Broadcast to all connected admin clients
                this.server?.emit('monitoring:update', {
                    systemHealth,
                    systemMetrics,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                this.logger.error('Failed to broadcast monitoring data:', error);

                // Send error to all clients
                this.server?.emit('monitoring:error', {
                    message: 'Failed to update monitoring data',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }, 30000); // 30 seconds
    }

    /**
     * Stop broadcasting monitoring data
     */
    private stopBroadcasting() {
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
            this.broadcastInterval = null;
            this.logger.log('Stopped monitoring broadcast');
        }
    }

    /**
     * Get system health status
     */
    private async getSystemHealth() {
        const timestamp = new Date().toISOString();

        // Check Redis health
        let redisHealth: any;
        try {
            const redisInfo = await this.redisService.getInfo();
            const isHealthy = await this.redisService.isHealthy();
            redisHealth = {
                status: isHealthy ? 'healthy' : (redisInfo.connected ? 'warning' : 'error'),
                message: isHealthy ? 'Redis is healthy' : (redisInfo.connected ? 'Redis connected but unhealthy' : 'Redis is not connected'),
                timestamp,
                connected: redisInfo.connected,
                healthy: isHealthy,
                host: redisInfo.host,
                port: redisInfo.port,
            };
        } catch (error) {
            redisHealth = {
                status: 'error',
                message: 'Redis health check failed',
                timestamp,
                connected: false,
                healthy: false,
            };
        }

        // Check MongoDB health
        let mongodbHealth: any;
        try {
            const connectionState = this.mongooseConnection.readyState;
            const connected = connectionState === 1; // 1 = connected
            const dbName = this.mongooseConnection.name || 'unknown';

            mongodbHealth = {
                status: connected ? 'healthy' : 'error',
                message: connected ? `MongoDB connected to ${dbName}` : 'MongoDB is not connected',
                timestamp,
                connected,
                database: connected ? dbName : undefined,
            };
        } catch (error) {
            mongodbHealth = {
                status: 'error',
                message: 'MongoDB health check failed',
                timestamp,
                connected: false,
            };
        }

        // API is healthy if server is running
        const apiHealth = {
            status: 'healthy' as const,
            message: 'API server is responding',
            timestamp,
        };

        return {
            api: apiHealth,
            redis: redisHealth,
            mongodb: mongodbHealth,
        };
    }

    /**
     * Handle client request for manual refresh
     */
    @SubscribeMessage('monitoring:refresh')
    async handleRefresh(@ConnectedSocket() client: Socket, @GetWsUser() user: any) {
        if (user.role !== 'owner') {
            client.emit('monitoring:error', { message: 'Unauthorized' });
            return;
        }

        try {
            const [systemHealth, systemMetrics] = await Promise.all([
                this.getSystemHealth(),
                this.metricsService.getAllMetrics(),
            ]);

            client.emit('monitoring:update', {
                systemHealth,
                systemMetrics,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error(`Manual refresh failed for ${client.id}:`, error);
            client.emit('monitoring:error', {
                message: 'Failed to refresh monitoring data',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Handle client subscription to specific monitoring events
     */
    @SubscribeMessage('monitoring:subscribe')
    handleSubscribe(
        @ConnectedSocket() client: Socket,
        @GetWsUser() user: any,
        @MessageBody() data: { events?: string[] }
    ) {
        if (user.role !== 'owner') {
            client.emit('monitoring:error', { message: 'Unauthorized' });
            return { success: false, message: 'Unauthorized' };
        }

        // For now, all clients get all monitoring data
        // Future: implement selective event subscription
        this.logger.log(`Client ${client.id} subscribed to monitoring events`);

        return { success: true, message: 'Subscribed to monitoring events' };
    }
}
