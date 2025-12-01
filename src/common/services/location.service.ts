/**
 * Location Service - IP-based geolocation detection
 * Uses ip-api.com (free tier) for geolocation
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.interface';

export interface LocationData {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
}

interface IpApiResponse {
    status: string;
    country?: string;
    regionName?: string;
    city?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    isp?: string;
    query?: string;
    message?: string;
}

@Injectable()
export class LocationService {
    private readonly logger = new Logger(LocationService.name);
    private readonly cache = new Map<string, { data: LocationData; timestamp: number }>();
    private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
    private readonly enabled: boolean;
    private readonly apiUrl: string;

    constructor(private readonly configService: ConfigService<Config>) {
        // Check if location detection is enabled (default: true)
        const locationConfig = this.configService.get('location', { infer: true });
        this.enabled = locationConfig?.enabled !== false;
        this.apiUrl = locationConfig?.apiUrl || 'http://ip-api.com/json';
    }

    /**
     * Get location data from IP address
     * Uses caching to avoid too many API calls
     */
    async getLocationFromIp(ipAddress: string): Promise<LocationData | null> {
        // Skip if disabled or invalid IP
        if (!this.enabled || !ipAddress || ipAddress === 'Unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1') {
            return null;
        }

        // Check cache first
        const cached = this.cache.get(ipAddress);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            this.logger.debug(`Location cache hit for IP: ${ipAddress}`);
            return cached.data;
        }

        try {
            // Call IP geolocation API
            const response = await fetch(`${this.apiUrl}/${ipAddress}?fields=status,country,regionName,city,lat,lon,timezone,isp`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                // Add timeout
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });

            if (!response.ok) {
                throw new Error(`IP API returned status ${response.status}`);
            }

            const data: IpApiResponse = await response.json();

            if (data.status === 'fail') {
                this.logger.warn(`IP geolocation failed for ${ipAddress}: ${data.message}`);
                return null;
            }

            // Transform API response to our LocationData format
            const locationData: LocationData = {
                country: data.country || undefined,
                region: data.regionName || undefined,
                city: data.city || undefined,
                latitude: data.lat || undefined,
                longitude: data.lon || undefined,
                timezone: data.timezone || undefined,
                isp: data.isp || undefined,
            };

            // Cache the result
            this.cache.set(ipAddress, {
                data: locationData,
                timestamp: Date.now(),
            });

            // Clean up old cache entries (keep cache size reasonable)
            if (this.cache.size > 1000) {
                this.cleanupCache();
            }

            this.logger.debug(`Location detected for IP ${ipAddress}: ${locationData.city}, ${locationData.country}`);
            return locationData;
        } catch (error) {
            // Log error but don't fail - location is optional
            this.logger.warn(
                `Failed to get location for IP ${ipAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return null;
        }
    }

    /**
     * Clean up old cache entries
     */
    private cleanupCache(): void {
        const now = Date.now();
        const entriesToDelete: string[] = [];

        for (const [ip, entry] of this.cache.entries()) {
            if (now - entry.timestamp >= this.cacheTTL) {
                entriesToDelete.push(ip);
            }
        }

        entriesToDelete.forEach((ip) => this.cache.delete(ip));
        this.logger.debug(`Cleaned up ${entriesToDelete.length} expired cache entries`);
    }

    /**
     * Clear all cache entries
     */
    clearCache(): void {
        this.cache.clear();
        this.logger.debug('Location cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; entries: number } {
        return {
            size: this.cache.size,
            entries: this.cache.size,
        };
    }
}

