export type PathMatchMode = 'folder' | 'keyword';

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

export interface StyleContextSettings {
	version: number;
	themeClassPrefix: string;
	themeContextEnabled: boolean;
	notePathContextEnabled: boolean;
	resourceVariablesEnabled: boolean;
	pathRules: PathRule[];
	resourceRules: ResourceRule[];
}

export const DEFAULT_SETTINGS: StyleContextSettings = {
	version: 1,
	themeClassPrefix: 'theme-mod-',
	themeContextEnabled: true,
	notePathContextEnabled: true,
	resourceVariablesEnabled: true,
	pathRules: [],
	resourceRules: [],
};
