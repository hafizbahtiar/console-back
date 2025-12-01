import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { parseUserAgent } from '../../common/utils/user-agent.util';
import { LocationService } from '../../common/services/location.service';

@Injectable()
export class SessionsService {
    private readonly logger = new Logger(SessionsService.name);

    constructor(
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
        private readonly locationService: LocationService,
    ) { }

    async create(sessionData: Partial<Session>): Promise<SessionDocument> {
        // If IP address is provided, try to get location data
        if (sessionData.ipAddress && sessionData.ipAddress !== 'Unknown') {
            try {
                const locationData = await this.locationService.getLocationFromIp(
                    sessionData.ipAddress,
                );
                if (locationData) {
                    sessionData.country = locationData.country;
                    sessionData.region = locationData.region;
                    sessionData.city = locationData.city;
                    sessionData.latitude = locationData.latitude;
                    sessionData.longitude = locationData.longitude;
                    sessionData.timezone = locationData.timezone;
                    sessionData.isp = locationData.isp;
                }
            } catch (error) {
                // Log error but don't fail session creation
                this.logger.warn(
                    `Failed to get location for session: ${error instanceof Error ? error.message : 'Unknown error'}`,
                );
            }
        }

        const session = new this.sessionModel(sessionData);
        return session.save();
    }

    async findById(id: string): Promise<SessionDocument | null> {
        return this.sessionModel.findById(id).exec();
    }

    async findByUserId(userId: string): Promise<any[]> {
        // Convert string userId to ObjectId for proper querying
        let userIdObjectId: Types.ObjectId;
        try {
            userIdObjectId = new Types.ObjectId(userId);
        } catch (error) {
            this.logger.error(`Invalid userId format: ${userId}`, error);
            return [];
        }

        // Query all sessions (both active and inactive) for this user
        const sessions = await this.sessionModel
            .find({ userId: userIdObjectId })
            .sort({ lastActivityAt: -1, createdAt: -1 })
            .exec();

        return sessions.map((session) => {
            const sessionDoc = session.toObject
                ? session.toObject()
                : (session as any);

            // If device info is missing but userAgent exists, parse it on-the-fly
            let deviceType = sessionDoc.deviceType;
            let deviceName = sessionDoc.deviceName;
            let browser = sessionDoc.browser;
            let os = sessionDoc.os;

            if (
                sessionDoc.userAgent &&
                (!deviceType || !deviceName || !browser || !os)
            ) {
                const deviceInfo = parseUserAgent(sessionDoc.userAgent);

                deviceType = deviceType || deviceInfo.deviceType;
                deviceName = deviceName || deviceInfo.deviceName;
                browser = browser || deviceInfo.browser;
                os = os || deviceInfo.os;
            }

            return {
                id: sessionDoc._id.toString(),
                userAgent: sessionDoc.userAgent,
                ipAddress: sessionDoc.ipAddress,
                deviceType,
                deviceName,
                browser,
                os,
                country: sessionDoc.country,
                region: sessionDoc.region,
                city: sessionDoc.city,
                latitude: sessionDoc.latitude,
                longitude: sessionDoc.longitude,
                timezone: sessionDoc.timezone,
                isp: sessionDoc.isp,
                isActive: sessionDoc.isActive,
                lastActivityAt: sessionDoc.lastActivityAt,
                createdAt: (sessionDoc as any).createdAt || new Date(),
                updatedAt: (sessionDoc as any).updatedAt || new Date(),
            };
        });
    }

    async findByAccountId(accountId: string): Promise<SessionDocument[]> {
        return this.sessionModel
            .find({ accountId, isActive: true })
            .sort({ lastActivityAt: -1 })
            .exec();
    }

    async updateActivity(sessionId: string): Promise<void> {
        await this.sessionModel
            .findByIdAndUpdate(sessionId, {
                lastActivityAt: new Date(),
            })
            .exec();
    }

    async deactivate(sessionId: string): Promise<void> {
        await this.sessionModel
            .findByIdAndUpdate(sessionId, {
                isActive: false,
            })
            .exec();
    }

    async revokeSession(userId: string, sessionId: string): Promise<void> {
        const session = await this.findById(sessionId);
        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Verify session belongs to user
        if (session.userId.toString() !== userId) {
            throw new ForbiddenException('You can only revoke your own sessions');
        }

        await this.deactivate(sessionId);
    }

    async revokeAllSessions(userId: string): Promise<void> {
        // Convert string userId to ObjectId for proper querying
        const userIdObjectId = new Types.ObjectId(userId);

        await this.sessionModel
            .updateMany(
                { userId: userIdObjectId, isActive: true },
                { isActive: false },
            )
            .exec();
    }

    async deactivateAllByUserId(userId: string): Promise<void> {
        // Convert string userId to ObjectId for proper querying
        const userIdObjectId = new Types.ObjectId(userId);

        await this.sessionModel
            .updateMany(
                { userId: userIdObjectId, isActive: true },
                { isActive: false },
            )
            .exec();
    }

    async deactivateAllByAccountId(accountId: string): Promise<void> {
        await this.sessionModel
            .updateMany({ accountId, isActive: true }, { isActive: false })
            .exec();
    }

    async updateFcmToken(
        sessionId: string,
        fcmToken: string,
    ): Promise<SessionDocument | null> {
        return this.sessionModel
            .findByIdAndUpdate(sessionId, { fcmToken }, { new: true })
            .exec();
    }

    async delete(id: string): Promise<void> {
        await this.sessionModel.findByIdAndDelete(id).exec();
    }

    async cleanupExpired(): Promise<number> {
        const result = await this.sessionModel
            .deleteMany({
                expiresAt: { $lt: new Date() },
            })
            .exec();
        return result.deletedCount || 0;
    }
}
