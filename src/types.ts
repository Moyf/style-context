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
}

export interface BackgroundImageSettings {
	enabled: boolean;
	/** A CSS custom property containing a published image value. */
	variableName: string;
	opacity: number;
	blendMode: BackgroundBlendMode;
	size: BackgroundSize;
	position: BackgroundPosition;
	repeat: BackgroundRepeat;
	attachment: BackgroundAttachment;
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
		variableName: '',
		opacity: 0.35,
		blendMode: 'normal',
		size: 'cover',
		position: 'center',
		repeat: 'no-repeat',
		attachment: 'fixed',
	},
};
