import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { WebSocketErrorResponse } from '../interfaces/websocket-events.interface';

/**
 * WebSocket Exception Filter
 * 
 * Catches and handles WebSocket exceptions, sending formatted error responses to clients.
 */
@Catch()
export class WsExceptionFilter {
    private readonly logger = new Logger(WsExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const client: Socket = host.switchToWs().getClient();
        const user = client.data.user;

        let errorResponse: WebSocketErrorResponse;

        if (exception instanceof WsException) {
            // Handle NestJS WebSocket exceptions
            const error = exception.getError();
            const message = typeof error === 'string' ? error : (error as { message?: string })?.message || 'An error occurred';

            errorResponse = {
                error: 'WebSocket Error',
                code: 'WS_ERROR',
                message,
                timestamp: new Date(),
            };

            this.logger.warn(`WebSocket error for user ${user?.email || 'unknown'}: ${message}`);
        } else if (exception instanceof Error) {
            // Handle generic errors
            errorResponse = {
                error: 'Internal Server Error',
                code: 'INTERNAL_ERROR',
                message: process.env.NODE_ENV === 'production'
                    ? 'An internal error occurred'
                    : exception.message,
                timestamp: new Date(),
            };

            this.logger.error(
                `Unhandled WebSocket error for user ${user?.email || 'unknown'}: ${exception.message}`,
                exception.stack,
            );
        } else {
            // Handle unknown errors
            errorResponse = {
                error: 'Unknown Error',
                code: 'UNKNOWN_ERROR',
                message: 'An unknown error occurred',
                timestamp: new Date(),
            };

            this.logger.error(`Unknown WebSocket error for user ${user?.email || 'unknown'}`);
        }

        // Emit error to client
        client.emit('error', errorResponse);

        // Optionally disconnect client for critical errors
        if (errorResponse.code === 'INTERNAL_ERROR' || errorResponse.code === 'UNKNOWN_ERROR') {
            setTimeout(() => {
                client.disconnect(true);
            }, 1000);
        }
    }
}

