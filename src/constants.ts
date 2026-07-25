export const LEGACY_THEME_CLASS_PREFIX = 'sc-theme-';
export const DEFAULT_THEME_CLASS_PREFIX = 'theme-mod-';
/**
 * Legacy prefix used by early 0.0.x builds. Kept only for a one-time
 * back-compat sweep on :root so old `--sc-resource-*` vars don't linger.
 * New builds publish whatever variable name the user typed verbatim.
 */
export const LEGACY_RESOURCE_VAR_PREFIX = '--sc-resource-';
export const SETTINGS_VERSION = 1;
export const DEFAULT_THEME_SLUG = 'default';

export const IMAGE_EXTENSIONS = new Set<string>([
	'png',
	'jpg',
	'jpeg',
	'gif',
	'webp',
	'svg',
	'bmp',
	'ico',
	'avif',
	'tiff',
	'tif',
]);
