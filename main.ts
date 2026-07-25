import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, type StyleContextSettings } from './src/types';
import { ThemeContextService } from './src/services/ThemeContextService';
import { NotePathContextService } from './src/services/NotePathContextService';
import { ResourceVariableService } from './src/services/ResourceVariableService';
import { SettingsTab } from './src/settings/SettingsTab';
import { registerCommands } from './src/commands';

export default class StyleContextPlugin extends Plugin {
	settings!: StyleContextSettings;
	themeCtx!: ThemeContextService;
	notePathCtx!: NotePathContextService;
	resourceVarCtx!: ResourceVariableService;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.themeCtx = new ThemeContextService(this, () => this.settings);
		this.notePathCtx = new NotePathContextService(this, () => this.settings);
		this.resourceVarCtx = new ResourceVariableService(
			this,
			() => this.settings,
		);

		this.addSettingTab(new SettingsTab(this.app, this));
		registerCommands(this);

		this.applyAll();
	}

	async loadSettings(): Promise<void> {
		this.settings = {
			...DEFAULT_SETTINGS,
			...((await this.loadData()) as Partial<StyleContextSettings>),
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Applies the current settings to all three services. Toggling a module
	 * off fully cleans the state it previously published.
	 */
	applyAll(): void {
		if (this.settings.themeContextEnabled) {
			this.themeCtx.enable();
			this.themeCtx.apply();
		} else {
			this.themeCtx.disable();
		}

		if (this.settings.notePathContextEnabled) {
			this.notePathCtx.enable();
		} else {
			this.notePathCtx.disable();
		}

		if (this.settings.resourceVariablesEnabled) {
			this.resourceVarCtx.enable();
			this.resourceVarCtx.apply();
		} else {
			this.resourceVarCtx.disable();
		}
	}

	/**
	 * Re-resolves resource variables (used by the reparse command).
	 */
	async reparseResources(): Promise<void> {
		this.resourceVarCtx.enable();
		this.resourceVarCtx.apply();
	}

	onunload(): void {
		// Defensive cleanup; register* already handles listeners.
		this.themeCtx.disable();
		this.notePathCtx.disable();
		this.resourceVarCtx.disable();
	}
}
