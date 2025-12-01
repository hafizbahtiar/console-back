import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { BaseGateway } from './gateways/base.gateway';
import { ChatGateway } from './gateways/chat.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { WsRateLimitGuard } from './guards/ws-rate-limit.guard';
import { WsExceptionFilter } from './filters/ws-exception.filter';

/**
 * WebSocket Module
 * 
 * Provides WebSocket functionality using Socket.IO.
 * This module configures the Socket.IO adapter and authentication.
 */
@Module({
    imports: [ConfigModule, AuthModule],
    providers: [
        BaseGateway,
        ChatGateway,
        WsJwtAuthGuard,
        WsRateLimitGuard,
        WsExceptionFilter,
    ],
    exports: [BaseGateway, ChatGateway, WsJwtAuthGuard, WsRateLimitGuard, WsExceptionFilter],
})
export class WebSocketModule { }

