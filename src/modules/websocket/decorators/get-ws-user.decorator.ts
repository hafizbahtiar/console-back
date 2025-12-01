import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

/**
 * Get WebSocket User Decorator
 * 
 * Extracts user information from authenticated WebSocket connection.
 * Usage: @GetWsUser() user: { userId: string, email: string, role: string }
 */
export const GetWsUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const client: Socket = ctx.switchToWs().getClient();
        return client.data.user;
    },
);

