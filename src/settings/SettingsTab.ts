import { App, Notice, PluginSettingTab, Setting, TFile, normalizePath, setTooltip } from 'obsidian';
import type StyleContextPlugin from '../../main';
import { DEFAULT_THEME_SLUG } from '../constants';
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
import { createSettingsGroup } from '../utils/settingsGroup';
import type { PathRule, ResourceRule } from '../types';

const DIAG_REFRESH_MS = 2000;

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

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.rulePreviewTiles.clear();

		this.renderResourceGroup(containerEl);
		this.renderGeneralGroup(containerEl);
		this.renderThemeGroup(containerEl);
		this.renderNotePathGroup(containerEl);
		this.renderDiagnosticsSection(containerEl);

		this.startDiagnosticsRefresh();
	}

	hide(): void {
		this.stopDiagnosticsRefresh();
		super.hide();
	}

	// ------------------------------------------------------------------
	// General intro group (no heading)
	// ------------------------------------------------------------------

	private renderGeneralGroup(containerEl: HTMLElement): void {
		const group = createSettingsGroup(containerEl);
		group.addSetting((setting) => {
			setting.setClass('sc-general-intro');
			const descEl = setting.descEl;
			descEl.empty();
			descEl.appendText(
				'This plugin exposes the current theme, note path rules, and vault image paths as CSS classes and variables, so your CSS snippets can react to runtime state without JavaScript.',
			);
			const linkLine = descEl.createEl('div');
			linkLine.appendText('See the ');
			linkLine.createEl('a', {
				text: 'Official CSS snippets documentation',
				href: 'https://obsidian.md/help/snippets',
				attr: { target: '_blank', rel: 'noopener' },
			});
			linkLine.appendText(' for details.');
		});
	}

	// ------------------------------------------------------------------
	// Theme context group
	// ------------------------------------------------------------------

	private renderThemeGroup(containerEl: HTMLElement): void {
		const group = createSettingsGroup(containerEl, 'Theme context');
		group.addSetting((setting) => {
			setting
				.setName('Publish theme class')
				.setDesc(
					"Add a unique theme class to the body for the current theme. This lets you adjust a specific theme via CSS snippets without modifying the theme's own files.",
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.themeContextEnabled)
						.onChange(async (value) => {
							this.plugin.settings.themeContextEnabled = value;
							await this.persistAndApply();
						}),
				);
		});

		group.addSetting((setting) => {
			setting.setName('Theme class prefix');
			this.renderThemePrefixDesc(setting);
			setting.addText((text) => {
				text.setPlaceholder('Theme-mod-')
					.setValue(this.plugin.settings.themeClassPrefix)
					.onChange(async (value) => {
						if (!isValidThemePrefix(value)) {
							this.showInputError(text.inputEl, 'Invalid prefix');
							return;
						}
						this.clearInputError(text.inputEl);
						this.plugin.settings.themeClassPrefix = value;
						await this.persistAndApply();
						this.renderThemePrefixDesc(setting);
					});
			});
		});
	}

	/**
	 * Renders the prefix description with a conversion-rule example and
	 * a live preview of the current theme's full CSS selector. Called
	 * initially and after every prefix change to keep the preview fresh
	 * without rebuilding the whole tab.
	 */
	private renderThemePrefixDesc(setting: Setting): void {
		const descEl = setting.descEl;
		descEl.empty();
		const prefix = this.plugin.settings.themeClassPrefix;

		// Conversion-rule explanation
		const ruleLine = descEl.createEl('div');
		ruleLine.appendText(
			'Adds a body class derived from the current theme name, for per-theme styling. The class lowercases the name and replaces non-alphanumeric characters with ',
		);
		ruleLine.createEl('code', { text: '-' });
		ruleLine.appendText('. e.g., "Brutal Gum" becomes ');
		ruleLine.createEl('code', { text: `.${prefix}brutal-gum` });

		// Current preview — clickable to copy the full selector
		const rawName = readThemeName(this.app);
		const slug = themeSlug(rawName || DEFAULT_THEME_SLUG);
		const selector = `body.${prefix}${slug}`;
		const previewLine = descEl.createEl('div');
		previewLine.appendText("Current theme's mod CSS class: ");
		const previewCode = previewLine.createEl('code', { text: selector });
		previewCode.addClass('sc-clickable-code');
		setTooltip(previewCode, 'Click to copy', { placement: 'top' });
		previewCode.onclick = async () => {
			await navigator.clipboard.writeText(selector);
			new Notice(`Copied: ${selector}`);
		};
	}

	// ------------------------------------------------------------------
	// Note path rules group
	// ------------------------------------------------------------------

	private renderNotePathGroup(containerEl: HTMLElement): void {
		const group = createSettingsGroup(containerEl, 'Note path rules');
		group.addSetting((setting) => {
			setting
				.setName('Publish path classes')
				.setDesc(
					'Add one or more CSS classes (comma-separated) to notes whose path matches a rule. This lets notes share styling without configuring cssclasses on each note.',
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.notePathContextEnabled)
						.onChange(async (value) => {
							this.plugin.settings.notePathContextEnabled = value;
							await this.persistAndApply();
						}),
				);
		});

		for (const rule of this.plugin.settings.pathRules) {
			this.renderPathRuleRow(group, rule);
		}

		group.addSetting((setting) => {
			setting.addButton((button) =>
				button
					.setButtonText('Add path rule')
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
						this.display();
					}),
			);
		});
	}

	private renderPathRuleRow(
		group: ReturnType<typeof createSettingsGroup>,
		rule: PathRule,
	): void {
		group.addSetting((setting) => {
			setting.setClass('sc-path-rule-row');
			setting
				// Match-mode dropdown (leftmost) — switches the pattern
				// input's behavior and placeholder below. Defaults to
				// Folder for new and legacy rules.
				.addDropdown((dropdown) => {
					dropdown.addOption('folder', 'Folder');
					dropdown.addOption('keyword', 'Keyword');
					dropdown.setValue(rule.matchMode ?? 'folder');
					dropdown.onChange(async (value) => {
						rule.matchMode =
							value === 'keyword' ? 'keyword' : 'folder';
						await this.persistAndApply();
						// Rebuild the row so the suggester / placeholder updates.
						this.display();
					});
				})
				.addText((text) => {
					if (rule.matchMode === 'folder') {
						text.setPlaceholder('Folder prefix');
						new FolderSuggest(this.app, text.inputEl);
					} else {
						text.setPlaceholder('Keyword in path');
					}
					text.setValue(rule.pattern)
						.onChange(async (value) => {
							rule.pattern = value;
							await this.persistAndApply();
						});
				})
				.addText((text) => {
					text.setPlaceholder('Class1, class2')
						.setValue(rule.className)
						.onChange(async (value) => {
							if (
								value.trim().length > 0 &&
								!areValidClassNames(value)
							) {
								this.showInputError(
									text.inputEl,
									'Invalid class names',
								);
								return;
							}
							this.clearInputError(text.inputEl);
							rule.className = value;
							await this.persistAndApply();
						});
				})
				.addToggle((toggle) =>
					toggle
						.setValue(rule.enabled)
						.onChange(async (value) => {
							rule.enabled = value;
							await this.persistAndApply();
						}),
				)
				.addExtraButton((button) =>
					button
						.setIcon('trash')
						.setTooltip('Delete rule')
						.onClick(async () => {
							this.plugin.settings.pathRules =
								this.plugin.settings.pathRules.filter(
									(r) => r.id !== rule.id,
								);
							await this.persistAndApply();
							this.display();
						}),
				);
		});
	}

	// ------------------------------------------------------------------
	// Resource variables group
	// ------------------------------------------------------------------

	private renderResourceGroup(containerEl: HTMLElement): void {
		const group = createSettingsGroup(containerEl, 'Local image variable');
		group.addSetting((setting) => {
			setting.setClass('sc-resource-toggle');
			setting.setName('Publish local image variables');
			// Rich description: explain why this module exists + show the
			// CSS contract. descEl is rebuilt (not setDesc) so we can embed
			// a <pre><code> block the way Obsidian's own settings do.
			const descEl = setting.descEl;
			descEl.empty();
			descEl.appendText(
				'Obsidian regenerates resource URLs on every reload, so a raw path cannot be used directly inside url(). This module maps a vault image to a stable CSS variable for background-image and similar use cases.',
			);
			const pre = descEl.createEl('pre');
			pre.createEl('code', {
				text: '.hero {\n  background-image: var(--my-banner);\n}',
			});
			setting.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.resourceVariablesEnabled)
					.onChange(async (value) => {
						this.plugin.settings.resourceVariablesEnabled =
							value;
						await this.persistAndApply();
					}),
			);
		});

		for (const rule of this.plugin.settings.resourceRules) {
			this.renderResourceRuleRow(group, rule);
		}

		group.addSetting((setting) => {
			setting.addButton((button) =>
				button
					.setButtonText('Add image variable')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.resourceRules.push({
							id: generateId('rr'),
							filePath: '',
							variableName: this.generateDefaultVarName(),
							enabled: true,
						});
						await this.persistAndApply();
						this.display();
					}),
			);
		});
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

	private renderResourceRuleRow(
		group: ReturnType<typeof createSettingsGroup>,
		rule: ResourceRule,
	): void {
		group.addSetting((setting) => {
			setting.setClass('sc-resource-rule-row');
			setting
				.addText((text) => {
					text.setPlaceholder('Vault file path')
						.setValue(rule.filePath)
						.onChange(async (value) => {
							rule.filePath = value;
							await this.persistAndApply();
							this.refreshRuleTile(rule);
						});
					new FileSuggest(this.app, text.inputEl);
				})
			.addText((text) => {
				text.setPlaceholder('--my-var')
					.setValue(rule.variableName)
					.onChange(async (value) => {
						if (
							value.trim().length === 0 ||
							!isValidCssVarName(value)
						) {
							this.showInputError(
								text.inputEl,
								'Invalid CSS variable name (must start with --)',
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
								`Used by ${dupCount} other rule(s); later rules override earlier ones`,
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
					toggle
						.setValue(rule.enabled)
						.onChange(async (value) => {
							rule.enabled = value;
							await this.persistAndApply();
							this.refreshRuleTile(rule);
						}),
				)
				.addExtraButton((button) =>
					button
						.setIcon('trash')
						.setTooltip('Delete rule')
						.onClick(async () => {
							this.plugin.settings.resourceRules =
								this.plugin.settings.resourceRules.filter(
									(r) => r.id !== rule.id,
								);
							await this.persistAndApply();
							this.display();
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
		});
	}

	/**
	 * Refreshes a single rule's preview tile without rebuilding the tab.
	 * The tile is always present (placeholder when invalid, image when
	 * the rule resolves to a usable image file with a valid var name).
	 */
	private refreshRuleTile(rule: ResourceRule): void {
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
			placeholder('Rule disabled');
			return;
		}
		const varName = rule.variableName;
		if (varName.trim().length === 0) {
			placeholder('Set a CSS variable name');
			return;
		}
		if (!isValidCssVarName(varName)) {
			placeholder('Variable name is invalid');
			return;
		}
		if (rule.filePath.trim().length === 0) {
			placeholder('Set a vault image path');
			return;
		}
		const file = this.resolveResourceFile(rule.filePath);
		if (!file) {
			placeholder('Image file not found');
			return;
		}
		if (!isImageFile(file)) {
			placeholder('Not an image file');
			return;
		}
		// Final guard: confirm the variable is actually published on :root.
		// Without this, an unset var() would resolve to nothing but still
		// override the checkerboard via inline style — leaving the tile blank.
		const published = activeDocument.documentElement.style.getPropertyValue(varName);
		if (!published) {
			placeholder('Variable not published (check module toggle)');
			return;
		}

		// Valid + published: cover the checkerboard with the resolved
		// image and wire up the copy-on-click handler.
		tile.addClass('is-valid');
		tile.style.setProperty('background-image', `var(${varName})`);
		setTooltip(tile, `Click to copy: var(${varName})`, {
			placement: 'top',
		});
		tile.onclick = async () => {
			const text = `var(${varName})`;
			await navigator.clipboard.writeText(text);
			new Notice(`Copied: ${text}`);
		};
	}

	private resolveResourceFile(filePath: string): TFile | null {
		const path = normalizePath(filePath);
		if (path.length === 0) return null;
		const abstract = this.app.vault.getAbstractFileByPath(path);
		if (abstract instanceof TFile) return abstract;
		return null;
	}

	// ------------------------------------------------------------------
	// Diagnostics panel (SC-04)
	// ------------------------------------------------------------------

	private renderDiagnosticsSection(containerEl: HTMLElement): void {
		const group = createSettingsGroup(containerEl, 'Diagnostics');
		group.addSetting((setting) => {
			setting
				.setName('Live status')
				.setDesc(
					'Shows the current theme class, path-class map, and resource resolution.',
				)
				.addExtraButton((button) =>
					button
						.setIcon('refresh-cw')
						.setTooltip('Refresh')
						.onClick(() => this.refreshDiagnostics()),
				)
				.addExtraButton((button) =>
					button
						.setIcon('copy')
						.setTooltip('Copy snapshot')
						.onClick(async () => {
							const snapshot = ContextInspector.collect(
								this.plugin,
							);
							await navigator.clipboard.writeText(
								JSON.stringify(snapshot, null, 2),
							);
							new Notice('Style context copied');
						}),
				);
		});

		const panel = containerEl.createDiv('sc-settings-diagnostics');
		this.diagnosticsEl = panel;
		this.refreshDiagnostics();
	}

	private refreshDiagnostics(): void {
		const panel = this.diagnosticsEl;
		if (!panel) return;
		panel.empty();

		const snapshot = ContextInspector.collect(this.plugin);

		const title = panel.createDiv({
			cls: 'sc-diagnostics-title',
			text: 'Current style context',
		});
		void title;

		// Local images
		const resSection = panel.createDiv('sc-diagnostics-section');
		resSection.createDiv({
			cls: 'sc-diagnostics-label',
			text: 'Local image variables',
		});
		if (snapshot.resources.length === 0) {
			resSection.createDiv({
				cls: 'sc-diagnostics-mono',
				text: 'No enabled resource rules',
			});
		} else {
			this.renderTable(
				resSection,
				['Variable', 'Status'],
				snapshot.resources.map((row) => [
					row.variableName,
					row.resolved ? 'resolved' : row.error ?? 'unresolved',
				]),
			);
		}

		// Theme
		const themeSection = panel.createDiv('sc-diagnostics-section');
		themeSection.createDiv({
			cls: 'sc-diagnostics-label',
			text: 'Theme',
		});
		const themeRow = themeSection.createDiv({ cls: 'sc-diagnostics-mono' });
		themeRow.createEl('code', {
			text: `${snapshot.theme.appliedClass}`,
		});
		themeRow.appendText(
			` (raw: ${snapshot.theme.rawName || '(none)'}, slug: ${snapshot.theme.slug})`,
		);

		// Note path
		const pathSection = panel.createDiv('sc-diagnostics-section');
		pathSection.createDiv({
			cls: 'sc-diagnostics-label',
			text: 'Note path classes',
		});
		if (snapshot.notePath.length === 0) {
			pathSection.createDiv({
				cls: 'sc-diagnostics-mono',
				text: 'No open Markdown views',
			});
		} else {
			this.renderTable(
				pathSection,
				['Leaf path', 'Applied class', 'Rule'],
				snapshot.notePath.map((row) => [
					row.leafPath || '(unsaved)',
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
				if (cell === 'resolved') {
					td.createSpan({
						cls: 'sc-diagnostics-ok',
						text: cell,
					});
				} else if (
					cell !== '\u2014' &&
					(cell.startsWith('File not found') ||
						cell === 'unresolved')
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
