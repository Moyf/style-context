import { Notice } from 'obsidian';
import type StyleContextPlugin from '../../main';
import { ContextInspector } from '../services/ContextInspector';

/**
 * SC-06: Registers diagnostic commands. Command ids are stable and do not
 * include the plugin id (Obsidian prefixes it automatically).
 */
export function registerCommands(plugin: StyleContextPlugin): void {
	plugin.addCommand({
		id: 'copy-current-context',
		name: 'Copy current context',
		callback: async () => {
			const snapshot = ContextInspector.collect(plugin);
			const json = JSON.stringify(snapshot, null, 2);
			await navigator.clipboard.writeText(json);
			new Notice('Style context copied');
		},
	});

	plugin.addCommand({
		id: 'reparse-resource-variables',
		name: 'Reparse resource variables',
		callback: async () => {
			await plugin.reparseResources();
			new Notice('Resource variables reparsed');
		},
	});

	plugin.addCommand({
		id: 'copy-theme-selector',
		name: 'Copy theme selector',
		callback: async () => {
			const selector = plugin.themeCtx.currentSelector();
			await navigator.clipboard.writeText(selector);
			new Notice(`Copied: ${selector}`);
		},
	});
}
