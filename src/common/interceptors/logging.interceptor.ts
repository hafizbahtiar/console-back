import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging Interceptor
 * 
 * Logs incoming requests and outgoing responses for debugging and monitoring.
 * Only logs in development mode or when explicitly enabled.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const { method, url, body, query, params } = request;
        const startTime = Date.now();

        // Only log in development or if explicitly enabled
        const shouldLog = process.env.NODE_ENV === 'development' || process.env.ENABLE_REQUEST_LOGGING === 'true';

        if (shouldLog) {
            this.logger.log(`→ ${method} ${url}`, {
                query,
                params,
                body: this.sanitizeBody(body),
            });
        }

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const duration = Date.now() - startTime;
                    const statusCode = response.statusCode;

                    if (shouldLog) {
                        this.logger.log(
                            `← ${method} ${url} ${statusCode} (${duration}ms)`,
                            {
                                statusCode,
                                duration,
                                dataSize: JSON.stringify(data).length,
                            },
                        );
                    }
                },
                error: (error) => {
                    const duration = Date.now() - startTime;
                    if (shouldLog) {
                        this.logger.error(
                            `✗ ${method} ${url} Error (${duration}ms)`,
                            {
                                error: error.message,
                                statusCode: error.statusCode || 500,
                                duration,
                            },
                        );
                    }
                },
            }),
        );
    }

    /**
     * Sanitize request body to remove sensitive information
     */
    private sanitizeBody(body: any): any {
        if (!body || typeof body !== 'object') {
            return body;
        }

        const sensitiveFields = ['password', 'token', 'secret', 'accessToken', 'refreshToken'];
        const sanitized = { ...body };

        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '***REDACTED***';
            }
        }

        return sanitized;
    }
}

