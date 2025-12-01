/**
 * Utility functions for portfolio education
 */

/**
 * Calculate duration in months between two dates
 */
export function calculateEducationDurationMonths(startDate: Date, endDate?: Date): number {
    const end = endDate || new Date();
    const months = (end.getFullYear() - startDate.getFullYear()) * 12 + (end.getMonth() - startDate.getMonth());
    return Math.max(0, months);
}

/**
 * Format GPA as string (e.g., "3.5/4.0")
 */
export function formatGPA(gpa?: number, scale: number = 4.0): string {
    if (gpa === undefined || gpa === null) {
        return 'N/A';
    }
    return `${gpa.toFixed(2)}/${scale.toFixed(1)}`;
}

/**
 * Format education period (e.g., "2020 - 2024" or "2020 - Present")
 */
export function formatEducationPeriod(startDate: Date, endDate?: Date): string {
    const startYear = startDate.getFullYear();
    if (endDate) {
        const endYear = endDate.getFullYear();
        return `${startYear} - ${endYear}`;
    }
    return `${startYear} - Present`;
}

