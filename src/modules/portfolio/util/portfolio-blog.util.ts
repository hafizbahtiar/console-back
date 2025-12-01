/**
 * Utility functions for portfolio blog
 */

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a number if needed
 */
export async function generateUniqueSlug(
    baseSlug: string,
    checkExists: (slug: string) => Promise<boolean>,
    maxAttempts: number = 100,
): Promise<string> {
    let slug = baseSlug;
    let attempt = 0;

    while (await checkExists(slug) && attempt < maxAttempts) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
    }

    if (attempt >= maxAttempts) {
        throw new Error('Unable to generate unique slug after maximum attempts');
    }

    return slug;
}

