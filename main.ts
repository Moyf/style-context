import { Plugin, setIcon } from 'obsidian';
import { DEFAULT_SETTINGS, type StyleContextSettings } from './src/types';
import { ThemeContextService } from './src/services/ThemeContextService';
import { NotePathContextService } from './src/services/NotePathContextService';
import { ResourceVariableService } from './src/services/ResourceVariableService';
import { BackgroundImageService } from './src/services/BackgroundImageService';
import { SettingsTab } from './src/settings/SettingsTab';
import { registerCommands } from './src/commands';
import { pickRandomBackgroundImageValue } from './src/utils/background';

export default class StyleContextPlugin extends Plugin {
	settings!: StyleContextSettings;
	themeCtx!: ThemeContextService;
	notePathCtx!: NotePathContextService;
	resourceVarCtx!: ResourceVariableService;
	backgroundImageCtx!: BackgroundImageService;
	private settingsTab!: SettingsTab;
	private randomBackgroundRibbon: HTMLElement | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.themeCtx = new ThemeContextService(this, () => this.settings);
		this.notePathCtx = new NotePathContextService(this, () => this.settings);
		this.resourceVarCtx = new ResourceVariableService(
			this,
			() => this.settings,
		);
		this.backgroundImageCtx = new BackgroundImageService(
			() => this.settings,
			this.app,
		);

			this.settingsTab = new SettingsTab(this.app, this);
			this.addSettingTab(this.settingsTab);
			registerCommands(this);
			this.syncRandomBackgroundRibbon();
		this.registerEvent(
			this.app.workspace.on('window-open', () => this.applyAll()),
		);

		if (this.settings.backgroundImage.randomOnStartup) {
			await this.randomizeBackgroundImage();
		}
		this.applyAll();
	}

	async loadSettings(): Promise<void> {
		const stored =
			((await this.loadData()) as Partial<StyleContextSettings> | null) ?? {};
		this.settings = {
			...DEFAULT_SETTINGS,
			...stored,
			backgroundImage: {
				...DEFAULT_SETTINGS.backgroundImage,
				...(stored.backgroundImage ?? {}),
				filter: {
					...DEFAULT_SETTINGS.backgroundImage.filter,
					...(stored.backgroundImage?.filter ?? {}),
				},
			},
		};
		this.settings.resourceRules = this.settings.resourceRules.map((rule) => ({
			...rule,
			useForBackgroundImage: rule.useForBackgroundImage ?? true,
		}));
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

		this.applyBackgroundImage();
	}

	/** Applies only the background service for live Appearance controls. */
	applyBackgroundImage(): void {
		if (this.settings.backgroundImage.enabled) {
			this.backgroundImageCtx.enable();
			this.backgroundImageCtx.apply();
		} else {
			this.backgroundImageCtx.disable();
		}
	}

	/**
	 * Re-resolves resource variables (used by the reparse command).
	 */
	async reparseResources(): Promise<void> {
		this.resourceVarCtx.enable();
		this.resourceVarCtx.apply();
	}

	/** Selects and applies one eligible background image variable. */
	async randomizeBackgroundImage(): Promise<boolean> {
		const value = pickRandomBackgroundImageValue(
			this.settings.resourceRules,
			this.settings.backgroundImage.imageValue,
		);
		if (!value) return false;
		this.settings.backgroundImage.imageValue = value;
		await this.saveSettings();
		this.applyBackgroundImage();
		this.settingsTab.update();
		return true;
	}

	syncRandomBackgroundRibbon(): void {
		this.randomBackgroundRibbon?.remove();
		this.randomBackgroundRibbon = null;
		if (!this.settings.backgroundImage.randomBackgroundRibbon) return;
		this.randomBackgroundRibbon = this.addRibbonIcon(
			'image',
			'Randomize background image',
			() => {
				void this.randomizeBackgroundImage();
			},
		);
		setIcon(this.randomBackgroundRibbon, 'image');
	}

	onunload(): void {
		// Defensive cleanup; register* already handles listeners.
		this.themeCtx.disable();
		this.notePathCtx.disable();
		this.resourceVarCtx.disable();
		this.backgroundImageCtx.disable();
	}
}
