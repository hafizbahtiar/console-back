import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../guards/ws-jwt-auth.guard';

/**
 * Base WebSocket Gateway
 * 
 * Provides common WebSocket functionality that can be extended by other gateways.
 * Handles connection lifecycle and authentication.
 * 
 * Note: Authentication is handled in handleConnection using WsJwtAuthGuard.
 */
@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
    },
    namespace: '/',
})
export class BaseGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    protected readonly logger = new Logger(BaseGateway.name);
    private readonly wsJwtAuthGuard: WsJwtAuthGuard;

    constructor(wsJwtAuthGuard: WsJwtAuthGuard) {
        this.wsJwtAuthGuard = wsJwtAuthGuard;
    }

    afterInit(server: Server) {
        this.logger.log('✅ WebSocket server initialized');
    }

    async handleConnection(client: Socket) {
        // Authenticate connection using WsJwtAuthGuard
        // Create a mock ExecutionContext for the guard
        const context = {
            switchToWs: () => ({
                getClient: () => client,
            }),
            getType: () => 'ws',
        } as any;

        const isAuthenticated = await this.wsJwtAuthGuard.canActivate(context);

        if (!isAuthenticated) {
            // Guard already handles disconnection and logging
            return;
        }

        const user = client.data.user;
        if (user) {
            this.logger.log(`✅ WebSocket client connected: ${user.email} (${user.userId})`);
        }
    }

    handleDisconnect(client: Socket) {
        const user = client.data.user;
        if (user) {
            this.logger.log(`❌ WebSocket client disconnected: ${user.email} (${user.userId})`);
        } else {
            this.logger.log('❌ WebSocket client disconnected');
        }
    }
}

