import type { App } from 'obsidian';

/**
 * Minimal shapes for Obsidian internal-but-stable APIs used to read the
 * current theme name. These are not in the public typings but are widely
 * relied upon and stable. Access is done via a structural cast through
 * `unknown` (never `as any`).
 */
interface CustomCssLike {
	theme?: string;
}

interface AppInternals {
	customCss?: CustomCssLike;
	vault: {
		getConfig(key: string): unknown;
	};
}

/**
 * Reads the current theme name. Prefers the live `customCss.theme` value
 * (the active community theme, or "" when none is active), then falls back
 * to the persisted config value, then "".
 */
export function readThemeName(app: App): string {
	const internals = app as unknown as AppInternals;
	const fromCustomCss = internals.customCss?.theme;
	if (typeof fromCustomCss === 'string' && fromCustomCss.length > 0) {
		return fromCustomCss;
	}
	const fromConfig = internals.vault.getConfig('theme');
	if (typeof fromConfig === 'string' && fromConfig.length > 0) {
		return fromConfig;
	}
	return '';
}
