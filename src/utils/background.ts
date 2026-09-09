import type {
	BackgroundImageSettings,
	BackgroundModeSettings,
	RandomImageScope,
	ResourceRule,
	StyleContextSettings,
} from '../types';
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
 * The color mode a randomization is picking for. 'any' means the target's
 * mode is unknown (no theme class on the body), in which case mode-scoped
 * images stay eligible — restriction only applies to a known mode.
 */
export type RandomImageMode = 'light' | 'dark' | 'any';

/** Effective scope of a rule; unmigrated rules default to 'all'. */
function randomImageScope(rule: ResourceRule): RandomImageScope {
	return rule.randomScope ?? 'all';
}

/** True when the rule may join a randomization for the given mode. */
function isEligibleForRandomMode(
	rule: ResourceRule,
	mode: RandomImageMode,
): boolean {
	const scope = randomImageScope(rule);
	if (scope === 'none') return false;
	if (mode === 'any') return true;
	return scope === 'all' || scope === mode;
}

/** Lucide icons for compact per-rule random-scope buttons. */
const RANDOM_SCOPE_ICONS: Record<RandomImageScope, string> = {
	all: 'dices',
	light: 'sun',
	dark: 'moon',
	none: 'circle-slash',
};

/** Icon representing a random scope in the settings UI. */
export function randomScopeIcon(scope: RandomImageScope): string {
	return RANDOM_SCOPE_ICONS[scope];
}

/**
 * Picks an enabled, valid image variable that is eligible for the given
 * mode's random pool. When possible, the current choice is excluded so
 * pressing the shuffle button produces a visible change.
 */
export function pickRandomBackgroundImageValue(
	rules: readonly ResourceRule[],
	currentImageValue = '',
	random = Math.random,
	mode: RandomImageMode = 'any',
): string | null {
	const candidates = [
		...new Set(
			rules
				.filter(
					(rule) =>
						rule.enabled &&
						isEligibleForRandomMode(rule, mode) &&
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

/** Obsidian publishes the active mode as one of these classes on each body. */
const THEME_LIGHT_BODY_CLASS = 'theme-light';
const THEME_DARK_BODY_CLASS = 'theme-dark';

/**
 * Picks the config one target document resolves to. With per-mode enabled,
 * a document whose body carries `theme-light` / `theme-dark` resolves its
 * own mode's config; a document with neither class falls back to the global
 * config. Selection never consults the community theme name/slug. The
 * returned object is a live reference, so writes land on the selected
 * config only.
 */
export function resolveBackgroundImageConfig(
	settings: BackgroundImageSettings,
	targetDocument: Document,
): BackgroundModeSettings {
	if (settings.perModeEnabled) {
		if (targetDocument.body.classList.contains(THEME_LIGHT_BODY_CLASS)) {
			return settings.light;
		}
		if (targetDocument.body.classList.contains(THEME_DARK_BODY_CLASS)) {
			return settings.dark;
		}
	}
	return settings;
}

/**
 * Reads the color mode a document currently displays from its body classes.
 * Returns 'any' when neither theme class is present, so mode-scoped images
 * remain eligible for documents without an explicit mode.
 */
export function resolveBackgroundImageMode(
	targetDocument: Document,
): RandomImageMode {
	if (targetDocument.body.classList.contains(THEME_LIGHT_BODY_CLASS)) {
		return 'light';
	}
	if (targetDocument.body.classList.contains(THEME_DARK_BODY_CLASS)) {
		return 'dark';
	}
	return 'any';
}

/**
 * Randomizes the image value of the config the target document currently
 * displays — with per-mode enabled, only that document's light/dark config;
 * never the global config or the opposite mode. Candidates respect each
 * rule's random scope: mode-scoped images only join when the target
 * document displays that mode. Returns the new value, or null when no
 * eligible variable exists (nothing is mutated then).
 */
export function randomizeBackgroundImageValue(
	settings: StyleContextSettings,
	targetDocument: Document,
	random = Math.random,
): string | null {
	const config = resolveBackgroundImageConfig(
		settings.backgroundImage,
		targetDocument,
	);
	const value = pickRandomBackgroundImageValue(
		settings.resourceRules,
		config.imageValue,
		random,
		resolveBackgroundImageMode(targetDocument),
	);
	if (!value) return null;
	config.imageValue = value;
	return value;
}
