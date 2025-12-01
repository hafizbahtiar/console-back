/**
 * Utility functions for portfolio certifications
 */

/**
 * Check if a certification is expired
 */
export function isCertificationExpired(expiryDate?: Date): boolean {
    if (!expiryDate) {
        return false; // No expiry date means it doesn't expire
    }
    return new Date() > expiryDate;
}

/**
 * Check if a certification is expiring soon (within specified days)
 */
export function isCertificationExpiringSoon(expiryDate?: Date, daysThreshold: number = 30): boolean {
    if (!expiryDate) {
        return false;
    }
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
    return expiryDate <= thresholdDate && expiryDate > now;
}

/**
 * Get days until certification expires
 */
export function getDaysUntilExpiry(expiryDate?: Date): number | null {
    if (!expiryDate) {
        return null; // No expiry date
    }
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Format certification status (Valid, Expired, Expiring Soon)
 */
export function getCertificationStatus(expiryDate?: Date): 'Valid' | 'Expired' | 'Expiring Soon' | 'No Expiry' {
    if (!expiryDate) {
        return 'No Expiry';
    }
    if (isCertificationExpired(expiryDate)) {
        return 'Expired';
    }
    if (isCertificationExpiringSoon(expiryDate)) {
        return 'Expiring Soon';
    }
    return 'Valid';
}

