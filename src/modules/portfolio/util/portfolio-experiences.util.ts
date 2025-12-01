/**
 * Utility functions for portfolio experiences
 */

/**
 * Calculate duration in months between two dates
 */
export function calculateDurationMonths(startDate: Date, endDate?: Date): number {
    const end = endDate || new Date();
    const months = (end.getFullYear() - startDate.getFullYear()) * 12 + (end.getMonth() - startDate.getMonth());
    return Math.max(0, months);
}

/**
 * Format duration as human-readable string
 */
export function formatDuration(startDate: Date, endDate?: Date): string {
    const months = calculateDurationMonths(startDate, endDate);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
        return `${months} ${months === 1 ? 'month' : 'months'}`;
    }

    if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}`;
    }

    return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
}

