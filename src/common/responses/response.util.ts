import { HttpStatus } from '@nestjs/common';
import { SuccessResponse, PaginatedResponse, ErrorResponse, PaginationMeta } from './response.interface';

/**
 * Create a success response
 */
export function successResponse<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = HttpStatus.OK,
): SuccessResponse<T> {
    return {
        success: true,
        statusCode,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
    data: T[],
    pagination: PaginationMeta,
    message: string = 'Success',
    statusCode: number = HttpStatus.OK,
): PaginatedResponse<T> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const hasNextPage = pagination.page < totalPages;
    const hasPreviousPage = pagination.page > 1;

    return {
        success: true,
        statusCode,
        message,
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages,
            hasNextPage,
            hasPreviousPage,
        },
        timestamp: new Date().toISOString(),
    };
}

/**
 * Create an error response
 */
export function errorResponse(
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    error?: string,
    errors?: Record<string, string[]> | string[],
): ErrorResponse {
    return {
        success: false,
        statusCode,
        message,
        error: error || message,
        errors,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Create a created response (201)
 */
export function createdResponse<T>(
    data: T,
    message: string = 'Resource created successfully',
): SuccessResponse<T> {
    return successResponse(data, message, HttpStatus.CREATED);
}

/**
 * Create a no content response (204) - returns null for body
 */
export function noContentResponse(): null {
    return null;
}

/**
 * Helper to calculate pagination metadata from service result
 */
export function calculatePaginationMeta(
    page: number,
    limit: number,
    total: number,
): PaginationMeta {
    return {
        page,
        limit,
        total,
    };
}

