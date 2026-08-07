import type { Plugin, TAbstractFile } from 'obsidian';
import type { StyleContextSettings } from '../types';
import { referencesImageVariable } from '../utils/background';
import {
	rewriteResourcePaths,
	type ResourcePathRewriteResult,
} from '../utils/resourcePaths';

export interface ResourcePathSyncResult extends ResourcePathRewriteResult {
	backgroundAffected: boolean;
}

type CommitResourcePathSync = (result: ResourcePathSyncResult) => Promise<void>;

/** Keeps configured image variable paths current after Obsidian rename/move events. */
export class ResourcePathSyncService {
	private readonly plugin: Plugin;
	private readonly getSettings: () => StyleContextSettings;
	private readonly commit: CommitResourcePathSync;
	private enabled = false;
	private listenersRegistered = false;

	constructor(
		plugin: Plugin,
		getSettings: () => StyleContextSettings,
		commit: CommitResourcePathSync,
	) {
		this.plugin = plugin;
		this.getSettings = getSettings;
		this.commit = commit;
	}

	enable(): void {
		this.enabled = true;
		if (this.listenersRegistered) return;

		this.listenersRegistered = true;
		this.plugin.registerEvent(
			this.plugin.app.vault.on('rename', (file, oldPath) => {
				void this.handleRename(file, oldPath);
			}),
		);
	}

	disable(): void {
		this.enabled = false;
	}

	async handleRename(
		file: TAbstractFile,
		oldPath: string,
	): Promise<ResourcePathSyncResult | null> {
		if (!this.enabled) return null;

		const settings = this.getSettings();
		const rewrite = rewriteResourcePaths(settings.resourceRules, oldPath, file.path);
		if (rewrite === null) return null;

		const result: ResourcePathSyncResult = {
			...rewrite,
			backgroundAffected: referencesImageVariable(
				settings.backgroundImage.imageValue,
				rewrite.updatedVariableNames,
			),
		};
		await this.commit(result);
		return result;
	}
}
