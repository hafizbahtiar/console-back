/**
 * Utility functions for portfolio testimonials
 */

/**
 * Format rating as stars (e.g., "★★★★☆")
 */
export function formatRatingStars(rating?: number): string {
    if (!rating || rating < 1 || rating > 5) {
        return 'No rating';
    }

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

/**
 * Format rating as text (e.g., "4.5 out of 5")
 */
export function formatRatingText(rating?: number): string {
    if (!rating || rating < 1 || rating > 5) {
        return 'No rating';
    }
    return `${rating.toFixed(1)} out of 5`;
}

