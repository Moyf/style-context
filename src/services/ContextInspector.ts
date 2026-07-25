import type { Plugin } from 'obsidian';
import type { StyleContextSettings } from '../types';
import type { ThemeContextSnapshot } from './ThemeContextService';
import type { NotePathLeafSnapshot } from './NotePathContextService';
import type { ResourceResolution } from './ResourceVariableService';
import type StyleContextPlugin from '../../main';

export interface StyleContextSnapshot {
	timestamp: string;
	theme: ThemeContextSnapshot;
	notePath: NotePathLeafSnapshot[];
	resources: ResourceResolution[];
	settings: StyleContextSettings;
}

/**
 * SC-04 + SC-06: Collects the current style context from all three services
 * into a single serializable snapshot. Used by the settings diagnostics
 * panel and the "Copy current style context" command.
 */
export class ContextInspector {
	/**
	 * Builds a snapshot reflecting the live state of the plugin. Falls back
	 * gracefully when services are disabled (empty arrays / default theme).
	 */
	static collect(plugin: Plugin): StyleContextSnapshot {
		const p = plugin as StyleContextPlugin;
		return {
			timestamp: new Date().toISOString(),
			theme: p.themeCtx.current(),
			notePath: p.notePathCtx.current(),
			resources: p.resourceVarCtx.current(),
			settings: p.settings,
		};
	}
}
