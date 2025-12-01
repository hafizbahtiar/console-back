/**
 * Utility functions for portfolio skills
 */

import { SkillCategory } from '../dto/skills/create-skill.dto';

/**
 * Get all available skill categories
 */
export function getSkillCategories(): string[] {
    return Object.values(SkillCategory);
}

/**
 * Validate if a category is valid
 */
export function isValidSkillCategory(category: string): boolean {
    return Object.values(SkillCategory).includes(category as SkillCategory);
}

