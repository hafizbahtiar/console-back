import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';

/**
 * Owner-Only Guard
 * 
 * Ensures that only users with 'owner' role can access the endpoint.
 * Use with @UseGuards(JwtAuthGuard, OwnerOnlyGuard) or @UseGuards(OwnerOnlyGuard) if JwtAuthGuard is already applied at controller level.
 */
@Injectable()
export class OwnerOnlyGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        if (user.role !== 'owner') {
            throw new ForbiddenException('This endpoint is only accessible to owners');
        }

        return true;
    }
}

