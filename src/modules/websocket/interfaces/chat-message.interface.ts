/**
 * Chat Message Interface
 * 
 * Defines the structure of chat messages sent through WebSocket.
 */
export interface ChatMessage {
    id: string;
    userId: string;
    email: string;
    username?: string;
    message: string;
    room?: string;
    timestamp: Date;
    type?: 'message' | 'system' | 'typing' | 'presence';
}

/**
 * Typing Indicator Interface
 */
export interface TypingIndicator {
    userId: string;
    email: string;
    username?: string;
    room?: string;
    isTyping: boolean;
}

/**
 * User Presence Interface
 */
export interface UserPresence {
    userId: string;
    email: string;
    username?: string;
    status: 'online' | 'away' | 'offline';
    lastSeen?: Date;
    room?: string;
}

