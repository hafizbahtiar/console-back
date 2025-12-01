/**
 * Email Job Result Interface
 * 
 * Defines the result structure returned after processing an email job
 */

export interface EmailJobResult {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp: Date;
}

