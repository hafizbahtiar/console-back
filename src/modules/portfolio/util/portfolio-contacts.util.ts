/**
 * Utility functions for portfolio contacts
 */

/**
 * Common social media platforms with their default icons/colors
 */
export const SOCIAL_PLATFORMS = {
    GitHub: { icon: 'github', color: '#181717' },
    LinkedIn: { icon: 'linkedin', color: '#0077B5' },
    Twitter: { icon: 'twitter', color: '#1DA1F2' },
    Facebook: { icon: 'facebook', color: '#1877F2' },
    Instagram: { icon: 'instagram', color: '#E4405F' },
    YouTube: { icon: 'youtube', color: '#FF0000' },
    Medium: { icon: 'medium', color: '#000000' },
    DevTo: { icon: 'dev', color: '#0A0A0A' },
    Behance: { icon: 'behance', color: '#1769FF' },
    Dribbble: { icon: 'dribbble', color: '#EA4C89' },
    Codepen: { icon: 'codepen', color: '#000000' },
    StackOverflow: { icon: 'stackoverflow', color: '#F58025' },
} as const;

/**
 * Get platform info if it's a known platform
 */
export function getPlatformInfo(platform: string): { icon?: string; color?: string } | null {
    const platformKey = Object.keys(SOCIAL_PLATFORMS).find(
        (key) => key.toLowerCase() === platform.toLowerCase(),
    );
    return platformKey ? SOCIAL_PLATFORMS[platformKey as keyof typeof SOCIAL_PLATFORMS] : null;
}

/**
 * Validate if URL matches platform domain (optional validation)
 */
export function validatePlatformUrl(platform: string, url: string): boolean {
    const platformLower = platform.toLowerCase();
    const urlLower = url.toLowerCase();

    // Basic validation - check if URL contains platform name
    return urlLower.includes(platformLower);
}

