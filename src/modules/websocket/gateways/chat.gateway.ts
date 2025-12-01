import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards, UsePipes, UseFilters, ValidationPipe } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { BaseGateway } from './base.gateway';
import { WsJwtAuthGuard } from '../guards/ws-jwt-auth.guard';
import { WsRateLimitGuard } from '../guards/ws-rate-limit.guard';
import { WsExceptionFilter } from '../filters/ws-exception.filter';
import { GetWsUser } from '../decorators/get-ws-user.decorator';
import type { ChatMessage, TypingIndicator, UserPresence } from '../interfaces/chat-message.interface';
import { MessageEventDto } from '../dto/message-event.dto';
import { JoinRoomEventDto, LeaveRoomEventDto } from '../dto/room-event.dto';
import { TypingEventDto } from '../dto/typing-event.dto';

/**
 * Chat Gateway
 * 
 * Implements a sample chat gateway with:
 * - Message broadcasting
 * - Room/namespace support
 * - User presence tracking
 * - Typing indicators
 * - Message history (in-memory, optional)
 */
@WebSocketGateway({
    namespace: '/chat',
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
    },
})
@UseGuards(WsJwtAuthGuard, WsRateLimitGuard)
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ChatGateway extends BaseGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatLogger = new Logger(ChatGateway.name);

    // In-memory storage for message history (optional - can be replaced with database)
    private readonly messageHistory: Map<string, ChatMessage[]> = new Map();

    // Track user presence
    private readonly userPresence: Map<string, UserPresence> = new Map();

    // Track typing indicators
    private readonly typingUsers: Map<string, Set<string>> = new Map(); // room -> Set<userId>

    /**
     * Handle new connection
     */
    async handleConnection(client: Socket) {
        // BaseGateway handles authentication
        await super.handleConnection(client);

        const user = client.data.user;
        if (!user) {
            return;
        }

        // Update user presence
        this.updateUserPresence(user.userId, user.email, 'online');

        // Join default room
        client.join('general');

        // Notify others of user joining
        this.server.to('general').emit('userJoined', {
            userId: user.userId,
            email: user.email,
            timestamp: new Date(),
        });

        // Send current online users to the new connection
        const onlineUsers = Array.from(this.userPresence.values())
            .filter(p => p.status === 'online')
            .map(p => ({
                userId: p.userId,
                email: p.email,
                username: p.username,
            }));

        client.emit('onlineUsers', onlineUsers);

        this.chatLogger.log(`Chat client connected: ${user.email} (${user.userId})`);
    }

    /**
     * Handle disconnection
     */
    handleDisconnect(client: Socket) {
        const user = client.data.user;
        if (!user) {
            return;
        }

        // Update user presence
        this.updateUserPresence(user.userId, user.email, 'offline');

        // Remove typing indicators
        this.typingUsers.forEach((users, room) => {
            users.delete(user.userId);
            this.server.to(room).emit('typing', {
                userId: user.userId,
                email: user.email,
                isTyping: false,
                room,
            });
        });

        // Notify others of user leaving
        this.server.emit('userLeft', {
            userId: user.userId,
            email: user.email,
            timestamp: new Date(),
        });

        this.chatLogger.log(`Chat client disconnected: ${user.email} (${user.userId})`);
    }

    /**
     * Send message
     */
    @SubscribeMessage('message')
    handleMessage(
        @MessageBody() data: MessageEventDto,
        @ConnectedSocket() client: Socket,
        @GetWsUser() user: { userId: string; email: string; role?: string },
    ) {
        const room = data.room || 'general';
        const chatMessage: ChatMessage = {
            id: `${Date.now()}-${user.userId}`,
            userId: user.userId,
            email: user.email,
            message: data.message,
            room,
            timestamp: new Date(),
            type: 'message',
        };

        // Store message in history (optional)
        if (!this.messageHistory.has(room)) {
            this.messageHistory.set(room, []);
        }
        const history = this.messageHistory.get(room)!;
        history.push(chatMessage);

        // Keep only last 100 messages per room
        if (history.length > 100) {
            history.shift();
        }

        // Broadcast message to room
        this.server.to(room).emit('message', chatMessage);

        this.chatLogger.debug(`Message sent in room ${room} by ${user.email}`);
    }

    /**
     * Join room
     */
    @SubscribeMessage('joinRoom')
    handleJoinRoom(
        @MessageBody() data: JoinRoomEventDto,
        @ConnectedSocket() client: Socket,
        @GetWsUser() user: { userId: string; email: string },
    ) {
        const room = data.room;
        client.join(room);

        // Send message history for the room
        const history = this.messageHistory.get(room) || [];
        client.emit('messageHistory', {
            room,
            messages: history,
        });

        // Notify others in the room
        client.to(room).emit('userJoinedRoom', {
            userId: user.userId,
            email: user.email,
            room,
            timestamp: new Date(),
        });

        this.chatLogger.log(`User ${user.email} joined room: ${room}`);
    }

    /**
     * Leave room
     */
    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(
        @MessageBody() data: LeaveRoomEventDto,
        @ConnectedSocket() client: Socket,
        @GetWsUser() user: { userId: string; email: string },
    ) {
        const room = data.room;
        client.leave(room);

        // Notify others in the room
        client.to(room).emit('userLeftRoom', {
            userId: user.userId,
            email: user.email,
            room,
            timestamp: new Date(),
        });

        this.chatLogger.log(`User ${user.email} left room: ${room}`);
    }

    /**
     * Typing indicator
     */
    @SubscribeMessage('typing')
    handleTyping(
        @MessageBody() data: TypingEventDto,
        @ConnectedSocket() client: Socket,
        @GetWsUser() user: { userId: string; email: string },
    ) {
        const room = data.room || 'general';

        if (!this.typingUsers.has(room)) {
            this.typingUsers.set(room, new Set());
        }

        const typingSet = this.typingUsers.get(room)!;

        if (data.isTyping) {
            typingSet.add(user.userId);
        } else {
            typingSet.delete(user.userId);
        }

        // Broadcast typing indicator to room (excluding sender)
        const typingIndicator: TypingIndicator = {
            userId: user.userId,
            email: user.email,
            room,
            isTyping: data.isTyping,
        };

        client.to(room).emit('typing', typingIndicator);
    }

    /**
     * Get online users
     */
    @SubscribeMessage('getOnlineUsers')
    handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
        const onlineUsers = Array.from(this.userPresence.values())
            .filter(p => p.status === 'online')
            .map(p => ({
                userId: p.userId,
                email: p.email,
                username: p.username,
                lastSeen: p.lastSeen,
            }));

        client.emit('onlineUsers', onlineUsers);
    }

    /**
     * Update user presence
     */
    private updateUserPresence(userId: string, email: string, status: 'online' | 'away' | 'offline') {
        const presence: UserPresence = {
            userId,
            email,
            status,
            lastSeen: status === 'offline' ? new Date() : undefined,
        };

        this.userPresence.set(userId, presence);

        // Broadcast presence update
        this.server.emit('presenceUpdate', presence);
    }

    /**
     * Get message history for a room
     */
    @SubscribeMessage('getMessageHistory')
    handleGetMessageHistory(
        @MessageBody() data: { room?: string },
        @ConnectedSocket() client: Socket,
    ) {
        const room = data.room || 'general';
        const history = this.messageHistory.get(room) || [];

        client.emit('messageHistory', {
            room,
            messages: history,
        });
    }
}

