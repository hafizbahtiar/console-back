import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Socket } from 'socket.io';
import { Config } from '../../../config/config.interface';

/**
 * WebSocket JWT Authentication Guard
 * 
 * Validates JWT tokens for WebSocket connections.
 * Extracts token from handshake auth or query parameters.
 */
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtAuthGuard.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<Config>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();
        
        try {
            // Extract token from handshake auth or query
            const token = this.extractToken(client);

            if (!token) {
                this.logger.warn('WebSocket connection rejected: No token provided');
                client.disconnect();
                return false;
            }

            // Verify token
            const jwtConfig = this.configService.get('jwt', { infer: true });
            const payload = await this.jwtService.verifyAsync(token, {
                secret: jwtConfig?.accessSecret,
            });

            // Attach user info to socket for use in handlers
            client.data.user = {
                userId: payload.sub,
                email: payload.email,
                role: payload.role,
            };

            this.logger.debug(`WebSocket connection authenticated: ${payload.email} (${payload.sub})`);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`WebSocket connection rejected: Invalid token - ${errorMessage}`);
            client.disconnect();
            return false;
        }
    }

    /**
     * Extract JWT token from WebSocket handshake
     * Supports both auth object and query parameters
     */
    private extractToken(client: Socket): string | null {
        // Try handshake auth first (recommended)
        if (client.handshake.auth?.token) {
            return client.handshake.auth.token;
        }

        // Fallback to query parameter
        if (client.handshake.query?.token) {
            const token = client.handshake.query.token;
            return Array.isArray(token) ? token[0] : token;
        }

        // Try Authorization header (if Socket.IO supports it)
        const authHeader = client.handshake.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return null;
    }
}

