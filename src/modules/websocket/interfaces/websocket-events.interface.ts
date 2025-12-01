/**
 * WebSocket Event Types
 * 
 * Defines all WebSocket event types used across the application.
 */
export enum WebSocketEventType {
    // Connection events
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    CONNECTION_ERROR = 'connection_error',

    // Chat events
    MESSAGE = 'message',
    JOIN_ROOM = 'joinRoom',
    LEAVE_ROOM = 'leaveRoom',
    TYPING = 'typing',
    GET_ONLINE_USERS = 'getOnlineUsers',
    GET_MESSAGE_HISTORY = 'getMessageHistory',

    // Presence events
    USER_JOINED = 'userJoined',
    USER_LEFT = 'userLeft',
    USER_JOINED_ROOM = 'userJoinedRoom',
    USER_LEFT_ROOM = 'userLeftRoom',
    PRESENCE_UPDATE = 'presenceUpdate',
    ONLINE_USERS = 'onlineUsers',

    // History events
    MESSAGE_HISTORY = 'messageHistory',

    // Error events
    ERROR = 'error',
    VALIDATION_ERROR = 'validation_error',
    RATE_LIMIT_ERROR = 'rate_limit_error',
}

/**
 * WebSocket Event Payloads
 */
export interface MessageEventPayload {
    message: string;
    room?: string;
}

export interface JoinRoomEventPayload {
    room: string;
}

export interface LeaveRoomEventPayload {
    room: string;
}

export interface TypingEventPayload {
    isTyping: boolean;
    room?: string;
}

export interface GetMessageHistoryEventPayload {
    room?: string;
}

/**
 * WebSocket Error Response
 */
export interface WebSocketErrorResponse {
    error: string;
    code: string;
    message: string;
    timestamp: Date;
    event?: string;
}

/**
 * WebSocket Success Response
 */
export interface WebSocketSuccessResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    timestamp: Date;
}

