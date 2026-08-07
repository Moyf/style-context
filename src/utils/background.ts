import type { ResourceRule } from '../types';
import { isValidCssVarName } from './validation';

const FALLBACK_IMAGE_FUNCTION_RE = /^(?:none|(?:-webkit-)?(?:url|var|image|image-set|cross-fade|element|paint|(?:repeating-)?(?:linear|radial|conic)-gradient)\s*\()/i;

/** Trims a complete CSS background-image value supplied by the user. */
export function normalizeBackgroundImageValue(value: unknown): string {
	if (typeof value !== 'string') return '';
	return value.trim();
}

/** Returns true when a valid custom property name still needs `var(...)`. */
export function isBareBackgroundImageVariable(value: unknown): boolean {
	return isValidCssVarName(normalizeBackgroundImageValue(value));
}

/** Validates a complete value intended for the CSS background-image property. */
export function isValidBackgroundImageValue(value: unknown): boolean {
	const normalized = normalizeBackgroundImageValue(value);
	if (normalized.length === 0) return false;

	const css =
		typeof activeDocument === 'undefined'
			? undefined
			: activeDocument.defaultView?.CSS;
	if (css?.supports) {
		return css.supports('background-image', normalized);
	}

	// JSDOM and older webviews may not expose CSS.supports. Keep the fallback
	// conservative; the browser still parses the value through setProperty().
	return !/[;{}]/.test(normalized) && FALLBACK_IMAGE_FUNCTION_RE.test(normalized);
}

/**
 * Picks an enabled, valid image variable. When possible, the current choice
 * is excluded so pressing the shuffle button produces a visible change.
 */
export function pickRandomBackgroundImageValue(
	rules: readonly ResourceRule[],
	currentImageValue = '',
	random = Math.random,
): string | null {
	const candidates = [
		...new Set(
				rules
					.filter(
						(rule) =>
							rule.enabled &&
						rule.useForBackgroundImage !== false &&
							isValidCssVarName(rule.variableName.trim()),
					)
				.map((rule) => `var(${rule.variableName.trim()})`),
		),
	];
	if (candidates.length === 0) return null;

	const currentValue = normalizeBackgroundImageValue(currentImageValue);
	const pool =
		candidates.length > 1
			? candidates.filter((variableName) => variableName !== currentValue)
			: candidates;
	const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
	return pool[index] ?? null;
}
