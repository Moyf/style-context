export const LEGACY_THEME_CLASS_PREFIX = 'sc-theme-';
export const DEFAULT_THEME_CLASS_PREFIX = 'theme-mod-';
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

/** Common CSS blend modes exposed by the background image setting. */
export const BACKGROUND_BLEND_MODES = [
	'normal',
	'darken',
	'multiply',
	'color-burn',
	'lighten',
	'screen',
	'color-dodge',
	'overlay',
	'soft-light',
	'hard-light',
	'difference',
	'exclusion',
	'hue',
	'saturation',
	'color',
	'luminosity',
	'plus-lighter',
	'plus-darker',
] as const;

export const BACKGROUND_SIZE_OPTIONS = ['auto', 'cover', 'contain'] as const;

export const BACKGROUND_POSITION_OPTIONS = [
	'center',
	'top',
	'bottom',
	'left',
	'right',
	'top left',
	'top right',
	'bottom left',
	'bottom right',
] as const;

export const BACKGROUND_REPEAT_OPTIONS = [
	'no-repeat',
	'repeat',
	'repeat-x',
	'repeat-y',
] as const;

export const BACKGROUND_ATTACHMENT_OPTIONS = ['fixed', 'scroll'] as const;
