/**
 * Standard response interfaces for consistent API responses
 */

export interface SuccessResponse<T = any> {
    success: true;
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
}

export interface PaginatedResponse<T = any> {
    success: true;
    statusCode: number;
    message: string;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    timestamp: string;
}

export interface ErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    error?: string;
    errors?: Record<string, string[]> | string[];
    timestamp: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
}

