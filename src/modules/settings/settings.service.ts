import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { SessionsService } from '../sessions/sessions.service';

/**
 * Settings Service
 * 
 * Orchestrates settings-related operations across different modules.
 * This service provides a unified interface for settings management.
 */
@Injectable()
export class SettingsService {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly sessionsService: SessionsService,
    ) { }

    /**
     * Verify that a user owns a resource
     * Used for ownership validation across settings endpoints
     */
    async verifyOwnership(userId: string, resourceUserId: string): Promise<boolean> {
        return userId === resourceUserId;
    }

    /**
     * Verify that a session belongs to a user
     */
    async verifySessionOwnership(userId: string, sessionId: string): Promise<boolean> {
        const session = await this.sessionsService.findById(sessionId);
        if (!session) {
            return false;
        }
        return session.userId.toString() === userId;
    }
}

