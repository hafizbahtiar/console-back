export class SessionResponseDto {
    id: string;
    userAgent: string;
    ipAddress?: string;
    deviceType?: string;
    deviceName?: string;
    browser?: string;
    os?: string;
    // Location fields
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
    isActive: boolean;
    lastActivityAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
