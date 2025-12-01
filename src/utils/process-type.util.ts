/**
 * Process Type Utility
 * 
 * Detects and manages process types for PM2 multi-process setup.
 * Allows conditional module loading based on process type.
 */
export enum ProcessType {
    API = 'api',
    WORKER = 'worker',
    SCHEDULER = 'scheduler',
}

/**
 * Get current process type from environment variable
 */
export function getProcessType(): ProcessType {
    const processType = process.env.PROCESS_TYPE?.toLowerCase();

    if (processType === 'worker') {
        return ProcessType.WORKER;
    }

    if (processType === 'scheduler') {
        return ProcessType.SCHEDULER;
    }

    // Default to API server
    return ProcessType.API;
}

/**
 * Check if current process is API server
 */
export function isApiProcess(): boolean {
    return getProcessType() === ProcessType.API;
}

/**
 * Check if current process is worker
 */
export function isWorkerProcess(): boolean {
    return getProcessType() === ProcessType.WORKER;
}

/**
 * Check if current process is scheduler
 */
export function isSchedulerProcess(): boolean {
    return getProcessType() === ProcessType.SCHEDULER;
}

