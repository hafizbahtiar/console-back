/**
 * Queue Names Constants
 * 
 * Centralized queue name definitions for type safety and consistency
 */
export enum QueueNames {
    EMAIL = 'email',
    // Add more queue names here as needed
    // NOTIFICATION = 'notification',
    // ANALYTICS = 'analytics',
}

/**
 * Queue name array for easy iteration
 */
export const QUEUE_NAMES = Object.values(QueueNames);

/**
 * Type guard to check if a string is a valid queue name
 */
export function isValidQueueName(name: string): name is QueueNames {
    return Object.values(QueueNames).includes(name as QueueNames);
}

