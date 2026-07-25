/**
 * Validates that a string is a legal HTML5 class name.
 * Per HTML5 spec: must start with a letter or hyphen (if hyphen, followed by
 * letter or underscore), then letters, digits, hyphens, or underscores.
 * This is a conservative single-token check.
 */
const CLASS_NAME_RE = /^-?[a-zA-Z_][a-zA-Z0-9_-]*$/;

/**
 * Validates that a string is a legal CSS custom property name,
 * including the leading "--" required by the spec.
 */
const CSS_VAR_NAME_RE = /^--[a-zA-Z_][a-zA-Z0-9_-]*$/;

/**
 * Validates a theme class prefix. Must start with a letter, may contain
 * letters, digits, hyphens, and underscores, and may end with a hyphen.
 * When concatenated with a slug ([a-z0-9-]+), it must form a valid CSS class.
 */
const THEME_PREFIX_RE = /^[a-zA-Z][a-zA-Z0-9_-]*-?$/;

export function isValidClassName(s: string): boolean {
	return CLASS_NAME_RE.test(s);
}

export function isValidCssVarName(s: string): boolean {
	return CSS_VAR_NAME_RE.test(s);
}

export function isValidThemePrefix(s: string): boolean {
	return THEME_PREFIX_RE.test(s);
}

/**
 * Parses a comma-separated list of class names into a deduplicated array.
 * Empty entries (from trailing commas or double commas) are dropped.
 * Order of first occurrence is preserved.
 */
export function parseClassNames(input: string): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const part of input.split(',')) {
		const trimmed = part.trim();
		if (trimmed.length === 0) continue;
		if (seen.has(trimmed)) continue;
		seen.add(trimmed);
		result.push(trimmed);
	}
	return result;
}

/**
 * Validates a comma-separated list of class names. Returns true only when
 * the input parses to at least one class and every parsed class is valid.
 */
export function areValidClassNames(input: string): boolean {
	const parsed = parseClassNames(input);
	if (parsed.length === 0) return false;
	return parsed.every((c) => isValidClassName(c));
}
