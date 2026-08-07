import {
	App,
	Notice,
	PluginSettingTab,
	TFile,
	TextComponent,
	normalizePath,
	setTooltip,
	type Setting,
	type SettingDefinition,
	type SettingDefinitionItem,
	type SettingGroupItem,
} from 'obsidian';
import type StyleContextPlugin from '../../main';
import {
	BACKGROUND_ATTACHMENT_OPTIONS,
	BACKGROUND_BLEND_MODES,
	BACKGROUND_POSITION_OPTIONS,
	BACKGROUND_REPEAT_OPTIONS,
	BACKGROUND_SIZE_OPTIONS,
	DEFAULT_THEME_SLUG,
} from '../constants';
import { ContextInspector } from '../services/ContextInspector';
import { FolderSuggest } from '../ui/FolderSuggest';
import { FileSuggest } from '../ui/FileSuggest';
import { generateId } from '../utils/array';
import {
	isValidCssVarName,
	isValidThemePrefix,
	areValidClassNames,
} from '../utils/validation';
import { isImageFile } from '../utils/media';
import { readThemeName } from '../utils/internals';
import { themeSlug } from '../utils/slug';
import {
	isValidBackgroundImageValue,
	normalizeBackgroundImageValue,
	pickRandomBackgroundImageValue,
} from '../utils/background';
import { t } from '../i18n/i18n';
import type { Messages } from '../i18n/types';
import type { PathRule, ResourceRule } from '../types';

const DIAG_REFRESH_MS = 2000;

/**
 * Dot-paths into StyleContextSettings that declarative controls bind to.
 * A literal union gives compile-time checking for control keys, which plain
 * string keys would not catch.
 */
type ControlKey =
	| 'themeContextEnabled'
	| 'notePathContextEnabled'
	| 'backgroundImage.enabled'
	| 'backgroundImage.opacity'
	| 'backgroundImage.blendMode'
	| 'backgroundImage.size'
	| 'backgroundImage.position'
	| 'backgroundImage.repeat'
	| 'backgroundImage.attachment'
	| 'backgroundImage.filter.brightness'
	| 'backgroundImage.filter.contrast'
	| 'backgroundImage.filter.saturate'
	| 'backgroundImage.filter.grayscale'
	| 'backgroundImage.filter.sepia'
	| 'backgroundImage.filter.invert'
	| 'backgroundImage.filter.hueRotate'
	| 'backgroundImage.filter.blur';

function getPath(source: unknown, path: string): unknown {
	let cursor = source;
	for (const part of path.split('.')) {
		if (cursor === null || typeof cursor !== 'object') return undefined;
		cursor = (cursor as Record<string, unknown>)[part];
	}
	return cursor;
}

function setPath(
	target: Record<string, unknown>,
	path: string,
	value: unknown,
): void {
	const parts = path.split('.');
	const last = parts.pop();
	if (!last) return;
	let cursor = target;
	for (const part of parts) {
		const next = cursor[part];
		if (next === null || typeof next !== 'object') {
			cursor[part] = {};
		}
		cursor = cursor[part] as Record<string, unknown>;
	}
	cursor[last] = value;
}

function optionsRecord(options: readonly string[]): Record<string, string> {
	return Object.fromEntries(options.map((option) => [option, option]));
}

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;
const formatPixels = (value: number): string => `${value}px`;
const formatDegrees = (value: number): string => `${value}°`;

export class SettingsTab extends PluginSettingTab {
	plugin: StyleContextPlugin;
	icon = 'palette';

	private diagnosticsEl: HTMLElement | null = null;
	private refreshHandle: number | null = null;
	/** Preview tiles keyed by rule id, refreshed independently to preserve input focus. */
	private rulePreviewTiles = new Map<string, HTMLElement>();

	constructor(app: App, plugin: StyleContextPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// ------------------------------------------------------------------
	// Declarative settings (Obsidian 1.13+)
	// ------------------------------------------------------------------

	getSettingDefinitions(): SettingDefinitionItem<ControlKey>[] {
		const messages = t();
		return [
			this.buildIntroDefinition(messages),
			this.buildResourceGroup(messages),
			this.buildBackgroundGroup(messages),
			this.buildThemeGroup(messages),
			this.buildNotePathGroup(messages),
			this.buildDiagnosticsGroup(messages),
		];
	}

	/**
	 * Control bindings use dot-paths (e.g. 'backgroundImage.filter.blur') to
	 * reach nested settings. Persistence goes through the plugin's usual
	 * save + apply cycle instead of the framework's default saveData.
	 */
	getControlValue(key: string): unknown {
		return getPath(this.plugin.settings, key);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		setPath(
			this.plugin.settings as unknown as Record<string, unknown>,
			key,
			value,
		);
		await this.persistAndApply();
	}

	hide(): void {
		this.stopDiagnosticsRefresh();
		super.hide();
	}

	// ------------------------------------------------------------------
	// General intro (no heading)
	// ------------------------------------------------------------------

	private buildIntroDefinition(
		messages: Messages,
	): SettingDefinitionItem<ControlKey> {
		return {
			name: '',
			searchable: false,
			render: (setting) => {
				setting.setClass('sc-general-intro');
				const descEl = setting.descEl;
				descEl.empty();
				descEl.appendText(messages.settings.intro);
				const linkLine = descEl.createDiv();
				linkLine.createEl('a', {
					text: messages.settings.documentation.link,
					href: 'https://obsidian.md/help/snippets',
					attr: { target: '_blank', rel: 'noopener' },
				});
			},
		};
	}

	// ------------------------------------------------------------------
	// Theme context group
	// ------------------------------------------------------------------

	private buildThemeGroup(
		messages: Messages,
	): SettingDefinitionItem<ControlKey> {
		return {
			type: 'group',
			heading: messages.settings.groups.themeContext,
			items: [
				{
					name: messages.settings.labels.publishThemeClass,
					desc: messages.settings.descriptions.publishThemeClass,
					control: { type: 'toggle', key: 'themeContextEnabled' },
				},
				{
					name: messages.settings.labels.themeClassPrefix,
					render: (setting) => {
						this.renderThemePrefixDesc(setting);
						setting.addText((text) => {
							text.setPlaceholder(messages.settings.placeholders.themeClassPrefix)
								.setValue(this.plugin.settings.themeClassPrefix)
								.onChange(async (value) => {
									if (!isValidThemePrefix(value)) {
										this.showInputError(
											text.inputEl,
											messages.settings.validation.invalidPrefix,
										);
										return;
									}
									this.clearInputError(text.inputEl);
									this.plugin.settings.themeClassPrefix = value;
									await this.persistAndApply();
									this.renderThemePrefixDesc(setting);
								});
						});
					},
				},
			],
		};
	}

	/**
	 * Renders the prefix description with a conversion-rule example and
	 * a live preview of the current theme's full CSS selector. Called
	 * initially and after every prefix change to keep the preview fresh
	 * without rebuilding the whole tab.
	 */
	private renderThemePrefixDesc(setting: Setting): void {
		const messages = t();
		const descEl = setting.descEl;
		descEl.empty();
		const prefix = this.plugin.settings.themeClassPrefix;

		// Conversion-rule explanation
		const ruleLine = descEl.createDiv();
		ruleLine.appendText(messages.settings.descriptions.themePrefixBefore);
		const exampleLine = descEl.createDiv();
		exampleLine.appendText(messages.settings.descriptions.themePrefixExample);
		exampleLine.appendText(' ');
		exampleLine.createEl('code', { text: `.${prefix}brutal-gum` });

		// Current preview — clickable to copy the full selector
		const rawName = readThemeName(this.app);
		const slug = themeSlug(rawName || DEFAULT_THEME_SLUG);
		const selector = `body.${prefix}${slug}`;
		const previewLine = descEl.createDiv();
		previewLine.appendText(messages.settings.descriptions.currentThemeClass);
		const previewCode = previewLine.createEl('code', { text: selector });
		previewCode.addClass('sc-clickable-code');
		setTooltip(previewCode, messages.settings.tooltips.clickToCopy(selector), {
			placement: 'top',
		});
		previewCode.onclick = async () => {
			await navigator.clipboard.writeText(selector);
			new Notice(messages.notices.copied(selector));
		};
	}

	// ------------------------------------------------------------------
	// Note path rules group
	// ------------------------------------------------------------------

	private buildNotePathGroup(
		messages: Messages,
	): SettingDefinitionItem<ControlKey> {
		const items: SettingGroupItem<ControlKey>[] = [
			{
				name: messages.settings.labels.publishPathClasses,
				desc: messages.settings.descriptions.publishPathClasses,
				control: { type: 'toggle', key: 'notePathContextEnabled' },
			},
			...this.plugin.settings.pathRules.map((rule) =>
				this.buildPathRuleRow(messages, rule),
			),
			{
				name: '',
				searchable: false,
				render: (setting) => {
					setting.addButton((button) =>
						button
							.setButtonText(messages.settings.buttons.addPathRule)
							.setCta()
							.onClick(async () => {
								this.plugin.settings.pathRules.push({
									id: generateId('pr'),
									matchMode: 'folder',
									pattern: '',
									className: '',
									enabled: true,
								});
								await this.persistAndApply();
								this.update();
							}),
					);
				},
			},
		];
		return {
			type: 'group',
			heading: messages.settings.groups.notePathRules,
			items,
		};
	}

	private buildPathRuleRow(
		messages: Messages,
		rule: PathRule,
	): SettingGroupItem<ControlKey> {
		return {
			name: '',
			searchable: false,
			render: (setting) => {
				setting.setClass('sc-path-rule-row');
				setting
					// Match-mode dropdown (leftmost) — switches the pattern
					// input's behavior and placeholder below. Defaults to
					// Folder for new and legacy rules.
					.addDropdown((dropdown) => {
						dropdown.addOption('folder', messages.settings.labels.folder);
						dropdown.addOption('keyword', messages.settings.labels.keyword);
						dropdown.setValue(rule.matchMode ?? 'folder');
						dropdown.onChange(async (value) => {
							rule.matchMode = value === 'keyword' ? 'keyword' : 'folder';
							await this.persistAndApply();
							// Rebuild the row so the suggester / placeholder updates.
							this.update();
						});
					})
					.addText((text) => {
						if (rule.matchMode === 'folder') {
							text.setPlaceholder(messages.settings.placeholders.folderPrefix);
							new FolderSuggest(this.app, text.inputEl);
						} else {
							text.setPlaceholder(messages.settings.placeholders.keywordInPath);
						}
						text.setValue(rule.pattern).onChange(async (value) => {
							rule.pattern = value;
							await this.persistAndApply();
						});
					})
					.addText((text) => {
						text.setPlaceholder(messages.settings.placeholders.classNames)
							.setValue(rule.className)
							.onChange(async (value) => {
								if (
									value.trim().length > 0 &&
									!areValidClassNames(value)
								) {
									this.showInputError(
										text.inputEl,
										messages.settings.validation.invalidClassNames,
									);
									return;
								}
								this.clearInputError(text.inputEl);
								rule.className = value;
								await this.persistAndApply();
							});
					})
					.addToggle((toggle) =>
						toggle.setValue(rule.enabled).onChange(async (value) => {
							rule.enabled = value;
							await this.persistAndApply();
						}),
					)
					.addExtraButton((button) =>
						button
							.setIcon('trash')
							.setTooltip(messages.settings.buttons.deleteRule)
							.onClick(async () => {
								this.plugin.settings.pathRules =
									this.plugin.settings.pathRules.filter(
										(r) => r.id !== rule.id,
									);
								await this.persistAndApply();
								this.update();
							}),
					);
			},
		};
	}

	// ------------------------------------------------------------------
	// Background image group
	// ------------------------------------------------------------------

	private buildBackgroundGroup(
		messages: Messages,
	): SettingDefinitionItem<ControlKey> {
		const labels = messages.settings.labels;
		const descriptions = messages.settings.descriptions;
		const pages = messages.settings.pages;
		const groups = messages.settings.groups;
		return {
			type: 'group',
			heading: messages.settings.groups.backgroundImage,
			items: [
				{
					name: labels.publishBackgroundImage,
					desc: descriptions.publishBackgroundImage,
					control: { type: 'toggle', key: 'backgroundImage.enabled' },
				},
				this.buildBackgroundImageValueRow(messages),
				{
					type: 'page',
					name: pages.backgroundAppearance,
					desc: pages.backgroundAppearanceDesc,
					items: [
						{
							type: 'group',
							heading: groups.backgroundDisplay,
							items: [
								{
									name: labels.backgroundOpacity,
									desc: descriptions.backgroundOpacity,
									control: {
										type: 'slider',
										key: 'backgroundImage.opacity',
										min: 0,
										max: 1,
										step: 0.05,
										displayFormat: formatPercent,
									},
								},
								this.buildBackgroundDropdown(
									labels.backgroundBlendMode,
									descriptions.backgroundBlendMode,
									BACKGROUND_BLEND_MODES,
									'backgroundImage.blendMode',
								),
								this.buildBackgroundDropdown(
									labels.backgroundSize,
									descriptions.backgroundSize,
									BACKGROUND_SIZE_OPTIONS,
									'backgroundImage.size',
								),
								this.buildBackgroundDropdown(
									labels.backgroundPosition,
									descriptions.backgroundPosition,
									BACKGROUND_POSITION_OPTIONS,
									'backgroundImage.position',
								),
								this.buildBackgroundDropdown(
									labels.backgroundRepeat,
									descriptions.backgroundRepeat,
									BACKGROUND_REPEAT_OPTIONS,
									'backgroundImage.repeat',
								),
								this.buildBackgroundDropdown(
									labels.backgroundAttachment,
									descriptions.backgroundAttachment,
									BACKGROUND_ATTACHMENT_OPTIONS,
									'backgroundImage.attachment',
								),
							],
						},
						{
							type: 'group',
							heading: groups.backgroundFilter,
							items: [
								this.buildFilterSlider(
									labels.filterBrightness,
									'backgroundImage.filter.brightness',
									0,
									2,
									formatPercent,
								),
								this.buildFilterSlider(
									labels.filterContrast,
									'backgroundImage.filter.contrast',
									0,
									2,
									formatPercent,
								),
								this.buildFilterSlider(
									labels.filterSaturate,
									'backgroundImage.filter.saturate',
									0,
									2,
									formatPercent,
								),
								this.buildFilterSlider(
									labels.filterGrayscale,
									'backgroundImage.filter.grayscale',
									0,
									1,
									formatPercent,
								),
								this.buildFilterSlider(
									labels.filterSepia,
									'backgroundImage.filter.sepia',
									0,
									1,
									formatPercent,
								),
								this.buildFilterSlider(
									labels.filterInvert,
									'backgroundImage.filter.invert',
									0,
									1,
									formatPercent,
								),
								this.buildFilterSlider(
									labels.filterHueRotate,
									'backgroundImage.filter.hueRotate',
									0,
									360,
									formatDegrees,
									5,
								),
								this.buildFilterSlider(
									labels.filterBlur,
									'backgroundImage.filter.blur',
									0,
									20,
									formatPixels,
									0.5,
								),
							],
						},
					],
				},
			],
		};
	}

	private buildBackgroundImageValueRow(
		messages: Messages,
	): SettingGroupItem<ControlKey> {
		return {
			name: messages.settings.labels.backgroundImageValue,
			desc: messages.settings.descriptions.backgroundImageValue,
			render: (setting) => {
				const background = this.plugin.settings.backgroundImage;
				let variableText: TextComponent | null = null;
				setting.addText((text) => {
					variableText = text;
					text.setPlaceholder(messages.settings.placeholders.backgroundImageValue)
						.setValue(normalizeBackgroundImageValue(background.imageValue))
						.onChange(async (value) => {
							const normalized = normalizeBackgroundImageValue(value);
							if (
								normalized.length > 0 &&
								!isValidBackgroundImageValue(normalized)
							) {
								this.showInputError(
									text.inputEl,
									messages.settings.validation.invalidBackgroundImageValue,
								);
								return;
							}
							this.clearInputError(text.inputEl);
							background.imageValue = normalized;
							await this.persistAndApply();
						});
				});

				setting.addExtraButton((button) =>
					button
						.setIcon('shuffle')
						.setTooltip(messages.settings.buttons.randomBackgroundImageValue)
						.onClick(async () => {
							const value = this.pickRandomBackgroundImageValue();
							if (!value) {
								new Notice(messages.notices.noImageVariables);
								return;
							}
							background.imageValue = value;
							variableText?.setValue(value);
							if (variableText) {
								this.clearInputError(variableText.inputEl);
							}
							await this.persistAndApply();
						}),
				);
			},
		};
	}

	private buildBackgroundDropdown(
		name: string,
		description: string,
		options: readonly string[],
		key: ControlKey,
	): SettingDefinition<ControlKey> {
		return {
			name,
			desc: description,
			control: {
				type: 'dropdown',
				key,
				options: optionsRecord(options),
			},
		};
	}

	private buildFilterSlider(
		name: string,
		key: ControlKey,
		min: number,
		max: number,
		displayFormat: (value: number) => string,
		step = 0.05,
	): SettingDefinition<ControlKey> {
		return {
			name,
			control: { type: 'slider', key, min, max, step, displayFormat },
		};
	}

	private pickRandomBackgroundImageValue(): string | null {
		return pickRandomBackgroundImageValue(
			this.plugin.settings.resourceRules,
			this.plugin.settings.backgroundImage.imageValue,
		);
	}

	// ------------------------------------------------------------------
	// Resource variables group
	// ------------------------------------------------------------------

	private buildResourceGroup(
		messages: Messages,
	): SettingDefinitionItem<ControlKey> {
		const items: SettingGroupItem<ControlKey>[] = [
			{
				name: messages.settings.labels.publishLocalImageVariables,
				render: (setting) => {
					setting.setClass('sc-resource-toggle');
					// Rich description: explain why this module exists + show the
					// CSS contract. descEl is rebuilt (not setDesc) so we can embed
					// a <pre><code> block the way Obsidian's own settings do.
					const descEl = setting.descEl;
					descEl.empty();
					descEl.appendText(
						messages.settings.descriptions.publishLocalImageVariables,
					);
					const pre = descEl.createEl('pre');
					pre.createEl('code', {
						text: '.hero {\n  background-image: var(--my-banner);\n}',
					});
					setting.addToggle((toggle) =>
						toggle
							.setValue(this.plugin.settings.resourceVariablesEnabled)
							.onChange(async (value) => {
								this.plugin.settings.resourceVariablesEnabled = value;
								await this.persistAndApply();
							}),
					);
				},
			},
			...this.plugin.settings.resourceRules.map((rule) =>
				this.buildResourceRuleRow(messages, rule),
			),
			{
				name: '',
				searchable: false,
				render: (setting) => {
					setting.addButton((button) =>
						button
							.setButtonText(messages.settings.buttons.addImageVariable)
							.setCta()
							.onClick(async () => {
								this.plugin.settings.resourceRules.push({
									id: generateId('rr'),
									filePath: '',
									variableName: this.generateDefaultVarName(),
									enabled: true,
								});
								await this.persistAndApply();
								this.update();
							}),
					);
				},
			},
		];
		return {
			type: 'group',
			heading: messages.settings.groups.localImageVariable,
			items,
		};
	}

	/**
	 * Generates a non-conflicting default variable name for a new rule,
	 * e.g. `--image-1`, `--image-2`, etc. The user can rename it.
	 * Always returns the first unused `--image-N` starting from 1.
	 */
	private generateDefaultVarName(): string {
		const existing = new Set(
			this.plugin.settings.resourceRules.map((r) => r.variableName),
		);
		let n = 1;
		let name = `--image-${n}`;
		while (existing.has(name)) {
			n++;
			name = `--image-${n}`;
		}
		return name;
	}

	private buildResourceRuleRow(
		messages: Messages,
		rule: ResourceRule,
	): SettingGroupItem<ControlKey> {
		return {
			name: '',
			searchable: false,
			render: (setting) => {
				setting.setClass('sc-resource-rule-row');
				setting
					.addText((text) => {
						text.setPlaceholder(messages.settings.placeholders.vaultFilePath)
							.setValue(rule.filePath)
							.onChange(async (value) => {
								rule.filePath = value;
								await this.persistAndApply();
								this.refreshRuleTile(rule);
							});
						new FileSuggest(this.app, text.inputEl);
					})
					.addText((text) => {
						text.setPlaceholder(messages.settings.placeholders.cssVariable)
							.setValue(rule.variableName)
							.onChange(async (value) => {
								if (
									value.trim().length === 0 ||
									!isValidCssVarName(value)
								) {
									this.showInputError(
										text.inputEl,
										messages.settings.validation.invalidCssVariableName,
									);
									return;
								}
								this.clearInputError(text.inputEl);
								// Warn (not block) on duplicate variable name across rules
								const dupCount = this.plugin.settings.resourceRules.filter(
									(r) => r.id !== rule.id && r.variableName === value,
								).length;
								if (dupCount > 0) {
									this.showInputWarning(
										text.inputEl,
										messages.settings.validation.duplicateVariableName(
											dupCount,
										),
									);
								} else {
									this.clearInputWarning(text.inputEl);
								}
								rule.variableName = value;
								await this.persistAndApply();
								this.refreshRuleTile(rule);
							});
					})
					.addToggle((toggle) =>
						toggle.setValue(rule.enabled).onChange(async (value) => {
							rule.enabled = value;
							await this.persistAndApply();
							this.refreshRuleTile(rule);
						}),
					)
					.addExtraButton((button) =>
						button
							.setIcon('trash')
							.setTooltip(messages.settings.buttons.deleteRule)
							.onClick(async () => {
								this.plugin.settings.resourceRules =
									this.plugin.settings.resourceRules.filter(
										(r) => r.id !== rule.id,
									);
								await this.persistAndApply();
								this.update();
							}),
					);

				// Prepend a per-rule preview tile to the control area so each
				// rule shows its own live image preview on the left side.
				const tile = setting.controlEl.createDiv({
					cls: 'sc-rule-preview-tile',
				});
				tile.setAttribute('data-rule-id', rule.id);
				setting.controlEl.prepend(tile);
				this.rulePreviewTiles.set(rule.id, tile);
				this.refreshRuleTile(rule);

				return () => {
					this.rulePreviewTiles.delete(rule.id);
				};
			},
		};
	}

	/**
	 * Refreshes a single rule's preview tile without rebuilding the tab.
	 * The tile is always present (placeholder when invalid, image when
	 * the rule resolves to a usable image file with a valid var name).
	 */
	private refreshRuleTile(rule: ResourceRule): void {
		const messages = t();
		const tile = this.rulePreviewTiles.get(rule.id);
		if (!tile) return;

		// Reset to placeholder state (checkerboard background shows through)
		tile.style.removeProperty('background-image');
		tile.removeClass('is-valid');
		tile.onclick = null;

		const placeholder = (msg: string) =>
			setTooltip(tile, msg, { placement: 'top' });

		// Walk through each requirement; the first unmet one produces a
		// specific placeholder tooltip so the user knows exactly what to fix.
		if (!rule.enabled) {
			placeholder(messages.settings.tooltips.ruleDisabled);
			return;
		}
		const varName = rule.variableName;
		if (varName.trim().length === 0) {
			placeholder(messages.settings.tooltips.setCssVariableName);
			return;
		}
		if (!isValidCssVarName(varName)) {
			placeholder(messages.settings.tooltips.variableNameInvalid);
			return;
		}
		if (rule.filePath.trim().length === 0) {
			placeholder(messages.settings.tooltips.setVaultImagePath);
			return;
		}
		const file = this.resolveResourceFile(rule.filePath);
		if (!file) {
			placeholder(messages.settings.tooltips.imageFileNotFound);
			return;
		}
		if (!isImageFile(file)) {
			placeholder(messages.settings.tooltips.notAnImageFile);
			return;
		}
		// Final guard: confirm the variable is actually published on :root.
		// Without this, an unset var() would resolve to nothing but still
		// override the checkerboard via inline style — leaving the tile blank.
		const published = activeDocument.defaultView
			?.getComputedStyle(activeDocument.documentElement)
			.getPropertyValue(varName);
		if (!published) {
			placeholder(messages.settings.tooltips.variableNotPublished);
			return;
		}

		// Valid + published: cover the checkerboard with the resolved
		// image and wire up the copy-on-click handler.
		tile.addClass('is-valid');
		tile.style.setProperty('background-image', `var(${varName})`);
		setTooltip(tile, messages.settings.tooltips.clickToCopy(`var(${varName})`), {
			placement: 'top',
		});
		tile.onclick = async () => {
			const text = `var(${varName})`;
			await navigator.clipboard.writeText(text);
			new Notice(messages.notices.copied(text));
		};
	}

	private resolveResourceFile(filePath: string): TFile | null {
		const path = normalizePath(filePath);
		if (path.length === 0) return null;
		const abstract = this.app.vault.getAbstractFileByPath(path);
		if (abstract instanceof TFile) return abstract;
		return null;
	}

	private resourceResolutionText(error?: string): string {
		const messages = t().settings.diagnostics;
		if (error === 'File path is empty') return messages.filePathEmpty;
		if (error?.startsWith('File not found: ')) {
			return messages.fileNotFound(error.slice('File not found: '.length));
		}
		return messages.unresolved;
	}

	// ------------------------------------------------------------------
	// Diagnostics panel (SC-04)
	// ------------------------------------------------------------------

	private buildDiagnosticsGroup(
		messages: Messages,
	): SettingDefinitionItem<ControlKey> {
		return {
			type: 'group',
			heading: messages.settings.groups.diagnostics,
			items: [
				{
					name: messages.settings.labels.liveStatus,
					desc: messages.settings.descriptions.liveStatus,
					render: (setting) => {
						setting
							.addExtraButton((button) =>
								button
									.setIcon('refresh-cw')
									.setTooltip(messages.settings.buttons.refresh)
									.onClick(() => this.refreshDiagnostics()),
							)
							.addExtraButton((button) =>
								button
									.setIcon('copy')
									.setTooltip(messages.settings.buttons.copySnapshot)
									.onClick(async () => {
										const snapshot = ContextInspector.collect(
											this.plugin,
										);
										await navigator.clipboard.writeText(
											JSON.stringify(snapshot, null, 2),
										);
										new Notice(messages.notices.styleContextCopied);
									}),
							);

						// The live panel is not a setting row; anchor it
						// directly after this row inside the group list.
						const panel = setting.settingEl.createDiv({
							cls: 'sc-settings-diagnostics',
						});
						setting.settingEl.insertAdjacentElement('afterend', panel);
						this.diagnosticsEl = panel;
						this.refreshDiagnostics();
						this.startDiagnosticsRefresh();

						return () => {
							this.stopDiagnosticsRefresh();
							this.diagnosticsEl = null;
						};
					},
				},
			],
		};
	}

	private refreshDiagnostics(): void {
		const messages = t();
		const diagnostics = messages.settings.diagnostics;
		const panel = this.diagnosticsEl;
		if (!panel) return;
		panel.empty();

		const snapshot = ContextInspector.collect(this.plugin);

		const title = panel.createDiv({
			cls: 'sc-diagnostics-title',
			text: diagnostics.currentStyleContext,
		});
		void title;

		// Local images
		const resSection = panel.createDiv('sc-diagnostics-section');
		resSection.createDiv({
			cls: 'sc-diagnostics-label',
			text: diagnostics.localImageVariables,
		});
		if (snapshot.resources.length === 0) {
			resSection.createDiv({
				cls: 'sc-diagnostics-mono',
				text: diagnostics.noEnabledResourceRules,
			});
		} else {
			this.renderTable(
				resSection,
				[diagnostics.headers.variable, diagnostics.headers.status],
				snapshot.resources.map((row) => [
					row.variableName,
					row.resolved
						? diagnostics.resolved
						: this.resourceResolutionText(row.error),
				]),
			);
		}

		// Theme
		const themeSection = panel.createDiv('sc-diagnostics-section');
		themeSection.createDiv({
			cls: 'sc-diagnostics-label',
			text: diagnostics.theme,
		});
		const themeRow = themeSection.createDiv({ cls: 'sc-diagnostics-mono' });
		themeRow.createEl('code', {
			text: `${snapshot.theme.appliedClass}`,
		});
		themeRow.appendText(
			diagnostics.rawTheme(snapshot.theme.rawName, snapshot.theme.slug),
		);

		// Note path
		const pathSection = panel.createDiv('sc-diagnostics-section');
		pathSection.createDiv({
			cls: 'sc-diagnostics-label',
			text: diagnostics.notePathClasses,
		});
		if (snapshot.notePath.length === 0) {
			pathSection.createDiv({
				cls: 'sc-diagnostics-mono',
				text: diagnostics.noOpenMarkdownViews,
			});
		} else {
			this.renderTable(
				pathSection,
				[
					diagnostics.headers.leafPath,
					diagnostics.headers.appliedClass,
					diagnostics.headers.rule,
				],
				snapshot.notePath.map((row) => [
					row.leafPath || diagnostics.unsaved,
					row.appliedClass ?? '\u2014',
					row.matchedRuleId ?? '\u2014',
				]),
			);
		}
	}

	private renderTable(
		container: HTMLElement,
		headers: string[],
		rows: string[][],
	): void {
		const diagnostics = t().settings.diagnostics;
		const table = container.createEl('table', {
			cls: 'sc-diagnostics-table',
		});
		const thead = table.createEl('thead');
		const headRow = thead.createEl('tr');
		for (const h of headers) {
			headRow.createEl('th', { text: h });
		}
		const tbody = table.createEl('tbody');
		for (const row of rows) {
			const tr = tbody.createEl('tr');
			for (const cell of row) {
				const td = tr.createEl('td');
				if (cell === diagnostics.resolved) {
					td.createSpan({
						cls: 'sc-diagnostics-ok',
						text: cell,
					});
				} else if (
					cell !== '\u2014' &&
					(cell.startsWith(diagnostics.fileNotFound('')) ||
						cell === diagnostics.unresolved)
				) {
					td.createSpan({
						cls: 'sc-diagnostics-error',
						text: cell,
					});
				} else {
					td.createEl('code', { text: cell });
				}
			}
		}
	}

	// ------------------------------------------------------------------
	// Inline validation helpers
	// ------------------------------------------------------------------

	private showInputError(inputEl: HTMLInputElement, message: string): void {
		const control = inputEl.closest('.setting-item-control');
		if (!control) return;
		let err = control.querySelector(':scope > .sc-setting-error');
		if (!err) {
			err = control.createDiv({
				cls: 'sc-setting-error',
				text: message,
			});
		} else {
			err.textContent = message;
		}
	}

	private clearInputError(inputEl: HTMLInputElement): void {
		const control = inputEl.closest('.setting-item-control');
		if (!control) return;
		const err = control.querySelector(':scope > .sc-setting-error');
		if (err) err.detach();
	}

	private showInputWarning(
		inputEl: HTMLInputElement,
		message: string,
	): void {
		const control = inputEl.closest('.setting-item-control');
		if (!control) return;
		let warn = control.querySelector(':scope > .sc-setting-warning');
		if (!warn) {
			warn = control.createDiv({
				cls: 'sc-setting-warning',
				text: message,
			});
		} else {
			warn.textContent = message;
		}
	}

	private clearInputWarning(inputEl: HTMLInputElement): void {
		const control = inputEl.closest('.setting-item-control');
		if (!control) return;
		const warn = control.querySelector(':scope > .sc-setting-warning');
		if (warn) warn.detach();
	}

	// ------------------------------------------------------------------
	// Diagnostics refresh lifecycle
	// ------------------------------------------------------------------

	private startDiagnosticsRefresh(): void {
		this.stopDiagnosticsRefresh();
		this.refreshHandle = this.plugin.registerInterval(
			window.setInterval(() => this.refreshDiagnostics(), DIAG_REFRESH_MS),
		);
	}

	private stopDiagnosticsRefresh(): void {
		if (this.refreshHandle !== null) {
			window.clearInterval(this.refreshHandle);
			this.refreshHandle = null;
		}
	}

	private async persistAndApply(): Promise<void> {
		await this.plugin.saveSettings();
		this.plugin.applyAll();
	}
}
