import { DEFAULT_THEME_SLUG } from '../constants';

/**
 * Converts a theme name into a CSS-safe, deterministic slug.
 * Collapses runs of non-alphanumeric characters into hyphens, trims
 * leading/trailing hyphens, lowercases. An empty result becomes "default".
 */
export function themeSlug(themeName: string): string {
	const slug = themeName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug.length > 0 ? slug : DEFAULT_THEME_SLUG;
}
