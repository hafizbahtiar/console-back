import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Ownership Guard
 * 
 * Validates that a user owns the resource they're trying to access.
 * Use with @OwnershipRequired() decorator to specify the resource ID parameter.
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Get the resource ID from the request (param, query, or body)
        const resourceId = request.params?.id || request.params?.userId || request.body?.userId;

        // If no resource ID is specified, allow access (user accessing their own data)
        if (!resourceId) {
            return true;
        }

        // Verify ownership
        if (resourceId !== user.userId) {
            throw new ForbiddenException('You can only access your own resources');
        }

        return true;
    }
}

