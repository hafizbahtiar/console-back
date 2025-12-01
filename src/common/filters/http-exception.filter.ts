import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { errorResponse } from '../responses/response.util';
import { ErrorResponse as ErrorResponseInterface } from '../responses/response.interface';

/**
 * Global HTTP Exception Filter
 * 
 * Catches all HTTP exceptions and formats them consistently.
 * Handles:
 * - HttpException (NestJS built-in exceptions)
 * - Validation errors (class-validator)
 * - Database errors (MongoDB duplicate key, etc.)
 * - Generic errors
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string;
        let error: string | undefined;
        let errors: Record<string, string[]> | string[] | undefined;

        // Handle NestJS HttpException first (most common)
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                error = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse as any;
                message = responseObj.message || exception.message || 'An error occurred';
                error = responseObj.error || message;

                // Handle validation errors (class-validator format)
                if (Array.isArray(responseObj.message)) {
                    // Validation errors: { message: ['field1 error', 'field2 error'] }
                    // or { message: ['field1 error'], error: 'Bad Request' }
                    errors = responseObj.message;
                    message = 'Validation failed';
                } else if (responseObj.errors && typeof responseObj.errors === 'object') {
                    // Validation errors: { message: 'Validation failed', errors: { field1: ['error1'], field2: ['error2'] } }
                    errors = responseObj.errors;
                }
            } else {
                message = exception.message || 'An error occurred';
                error = message;
            }

            // Log based on status code
            if (status >= 500) {
                this.logger.error(
                    `HTTP ${status} Error: ${message}`,
                    {
                        path: request.url,
                        method: request.method,
                        statusCode: status,
                        stack: exception.stack,
                    },
                );
            } else if (status >= 400) {
                this.logger.warn(
                    `HTTP ${status} Error: ${message}`,
                    {
                        path: request.url,
                        method: request.method,
                        statusCode: status,
                        errors,
                    },
                );
            }
        }
        // Handle MongoDB/Mongoose errors (must be checked after HttpException)
        else if (exception instanceof Error) {
            const errorName = (exception as any).name;

            // Handle MongoDB duplicate key errors
            if (errorName === 'MongoServerError' || errorName === 'MongoError') {
                const mongoError = exception as any;

                // Handle duplicate key errors (code 11000)
                if (mongoError.code === 11000) {
                    status = HttpStatus.CONFLICT;
                    const keyPattern = mongoError.keyPattern || {};
                    const key = Object.keys(keyPattern)[0] || 'field';
                    const keyValue = mongoError.keyValue?.[key] || 'value';
                    message = `${key} '${keyValue}' already exists`;
                    error = 'Conflict';
                    errors = { [key]: [`${key} must be unique`] };
                } else {
                    // Other MongoDB errors
                    status = HttpStatus.INTERNAL_SERVER_ERROR;
                    message = process.env.NODE_ENV === 'production'
                        ? 'A database error occurred'
                        : mongoError.message;
                    error = 'Database Error';
                }

                this.logger.error(
                    `MongoDB Error: ${mongoError.message}`,
                    {
                        path: request.url,
                        method: request.method,
                        code: mongoError.code,
                        stack: mongoError.stack,
                    },
                );
            }
            // Handle Mongoose validation errors
            else if (errorName === 'ValidationError') {
                const mongooseError = exception as any;
                status = HttpStatus.BAD_REQUEST;
                message = 'Validation failed';
                error = 'Bad Request';

                // Format Mongoose validation errors
                if (mongooseError.errors) {
                    const formattedErrors: Record<string, string[]> = {};
                    Object.keys(mongooseError.errors).forEach((key) => {
                        const err = mongooseError.errors[key];
                        formattedErrors[key] = [err.message || 'Invalid value'];
                    });
                    errors = formattedErrors;
                }

                this.logger.warn(
                    `Mongoose Validation Error: ${mongooseError.message}`,
                    {
                        path: request.url,
                        method: request.method,
                        errors,
                    },
                );
            }
            // Handle generic errors
            else {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = process.env.NODE_ENV === 'production'
                    ? 'An internal server error occurred'
                    : exception.message;
                error = 'Internal Server Error';

                this.logger.error(
                    `Unhandled Error: ${exception.message}`,
                    {
                        path: request.url,
                        method: request.method,
                        stack: exception.stack,
                    },
                );
            }
        }
        // Handle unknown errors
        else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'An unknown error occurred';
            error = 'Internal Server Error';

            this.logger.error(
                'Unknown Error',
                {
                    path: request.url,
                    method: request.method,
                    error: String(exception),
                    type: typeof exception,
                },
            );
        }

        // Format error response
        const errorResponseData: ErrorResponseInterface = errorResponse(
            message,
            status,
            error,
            errors,
        );

        // Send response
        response.status(status).json(errorResponseData);
    }
}

