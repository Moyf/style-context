import type {
	BACKGROUND_ATTACHMENT_OPTIONS,
	BACKGROUND_BLEND_MODES,
	BACKGROUND_POSITION_OPTIONS,
	BACKGROUND_REPEAT_OPTIONS,
	BACKGROUND_SIZE_OPTIONS,
} from './constants';

export type PathMatchMode = 'folder' | 'keyword';

export type BackgroundBlendMode = (typeof BACKGROUND_BLEND_MODES)[number];
export type BackgroundSize = (typeof BACKGROUND_SIZE_OPTIONS)[number];
export type BackgroundPosition = (typeof BACKGROUND_POSITION_OPTIONS)[number];
export type BackgroundRepeat = (typeof BACKGROUND_REPEAT_OPTIONS)[number];
export type BackgroundAttachment = (typeof BACKGROUND_ATTACHMENT_OPTIONS)[number];

export interface PathRule {
	id: string;
	/**
	 * 'folder': path prefix match (e.g. "4-Archive" matches "4-Archive/note.md").
	 * 'keyword': substring match anywhere in the path including filename
	 *           (e.g. "clipping" matches "Clippings/web-clip.md").
	 */
	matchMode: PathMatchMode;
	/** folder mode: path prefix. keyword mode: substring to search for. */
	pattern: string;
	className: string;
	enabled: boolean;
}

export interface ResourceRule {
	id: string;
	filePath: string;
	variableName: string;
	enabled: boolean;
	/** Whether this published variable may be selected as a background image. */
	useForBackgroundImage?: boolean;
}

/**
 * CSS filter adjustments for the background image layer. Every value sits at
 * its neutral default when unused, and neutral values are omitted from the
 * generated `filter` declaration.
 */
export interface BackgroundFilterSettings {
	/** Multiplier, 1 = unchanged. */
	brightness: number;
	/** Multiplier, 1 = unchanged. */
	contrast: number;
	/** Multiplier, 1 = unchanged. */
	saturate: number;
	/** 0–1, 0 = unchanged. */
	grayscale: number;
	/** 0–1, 0 = unchanged. */
	sepia: number;
	/** 0–1, 0 = unchanged. */
	invert: number;
	/** Degrees, 0 = unchanged. */
	hueRotate: number;
	/** Pixels, 0 = unchanged. */
	blur: number;
}

export interface BackgroundImageSettings {
	enabled: boolean;
	randomOnStartup: boolean;
	randomBackgroundRibbon: boolean;
	/** A complete CSS background-image value. */
	imageValue: string;
	opacity: number;
	blendMode: BackgroundBlendMode;
	size: BackgroundSize;
	position: BackgroundPosition;
	repeat: BackgroundRepeat;
	attachment: BackgroundAttachment;
	mobileToolbarTransparent: boolean;
	filter: BackgroundFilterSettings;
}

export interface StyleContextSettings {
	version: number;
	themeClassPrefix: string;
	themeContextEnabled: boolean;
	notePathContextEnabled: boolean;
	resourceVariablesEnabled: boolean;
	pathRules: PathRule[];
	resourceRules: ResourceRule[];
	backgroundImage: BackgroundImageSettings;
}

export const DEFAULT_SETTINGS: StyleContextSettings = {
	version: 1,
	themeClassPrefix: 'theme-mod-',
	themeContextEnabled: true,
	notePathContextEnabled: true,
	resourceVariablesEnabled: true,
	pathRules: [],
	resourceRules: [],
	backgroundImage: {
		enabled: false,
		randomOnStartup: false,
		randomBackgroundRibbon: true,
		imageValue: '',
		opacity: 0.35,
		blendMode: 'normal',
		size: 'cover',
		position: 'center',
		repeat: 'no-repeat',
		attachment: 'fixed',
		mobileToolbarTransparent: true,
		filter: {
			brightness: 1,
			contrast: 1,
			saturate: 1,
			grayscale: 0,
			sepia: 0,
			invert: 0,
			hueRotate: 0,
			blur: 0,
		},
	},
};
