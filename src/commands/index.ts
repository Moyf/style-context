import { Notice } from 'obsidian';
import type StyleContextPlugin from '../../main';
import { ContextInspector } from '../services/ContextInspector';
import { t } from '../i18n/i18n';

/**
 * SC-06: Registers diagnostic commands. Command ids are stable and do not
 * include the plugin id (Obsidian prefixes it automatically).
 */
export function registerCommands(plugin: StyleContextPlugin): void {
	const messages = t();
	plugin.addCommand({
		id: 'random-background-image',
		name: messages.commands.randomBackgroundImage,
		callback: async () => {
			if (await plugin.randomizeBackgroundImage()) {
				new Notice(messages.notices.backgroundImageRandomized);
			} else {
				new Notice(messages.notices.noImageVariables);
			}
		},
	});

	plugin.addCommand({
		id: 'copy-current-context',
		name: messages.commands.copyCurrentContext,
		callback: async () => {
			const snapshot = ContextInspector.collect(plugin);
			const json = JSON.stringify(snapshot, null, 2);
			await navigator.clipboard.writeText(json);
			new Notice(messages.notices.styleContextCopied);
		},
	});

	plugin.addCommand({
		id: 'reparse-resource-variables',
		name: messages.commands.reparseResourceVariables,
		callback: async () => {
			await plugin.reparseResources();
			new Notice(messages.notices.resourceVariablesReparsed);
		},
	});

	plugin.addCommand({
		id: 'copy-theme-selector',
		name: messages.commands.copyThemeSelector,
		callback: async () => {
			const selector = plugin.themeCtx.currentSelector();
			await navigator.clipboard.writeText(selector);
			new Notice(messages.notices.copied(selector));
		},
	});
}
