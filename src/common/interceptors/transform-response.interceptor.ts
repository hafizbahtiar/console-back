import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { SuccessResponse, PaginatedResponse } from '../responses/response.interface';

/**
 * Transform Response Interceptor
 * 
 * Automatically wraps responses in the standard SuccessResponse format.
 * Only wraps responses that are not already in the standard format.
 * 
 * This ensures all successful responses follow the same structure:
 * {
 *   success: true,
 *   statusCode: number,
 *   message: string,
 *   data: T,
 *   timestamp: string
 * }
 */
@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse<Response>();
        const statusCode = response.statusCode || 200;

        return next.handle().pipe(
            map((data) => {
                // Skip transformation if:
                // 1. Response is already in standard format (has success property)
                // 2. Response is null (for 204 No Content)
                // 3. Response is a stream or file download
                if (
                    data === null ||
                    data === undefined ||
                    (typeof data === 'object' && 'success' in data) ||
                    (data instanceof Buffer) ||
                    (typeof data === 'string' && data.startsWith('data:'))
                ) {
                    return data;
                }

                // If data is already a SuccessResponse or PaginatedResponse, return as-is
                if (
                    typeof data === 'object' &&
                    ('success' in data || 'data' in data) &&
                    'statusCode' in data &&
                    'message' in data
                ) {
                    return data;
                }

                // Wrap in standard format
                const successResponse: SuccessResponse<any> = {
                    success: true,
                    statusCode,
                    message: 'Success',
                    data,
                    timestamp: new Date().toISOString(),
                };

                return successResponse;
            }),
        );
    }
}

