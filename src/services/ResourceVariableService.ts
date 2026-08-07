import type { Plugin } from 'obsidian';
import { TFile, normalizePath } from 'obsidian';
import type { StyleContextSettings, ResourceRule } from '../types';

export interface ResourceResolution {
	ruleId: string;
	variableName: string;
	resolved: boolean;
	error?: string;
}

/**
 * SC-03: Resolves vault files into `url("...")` values and publishes them
 * as user-defined CSS variables on the root element. Missing files produce a
 * clear error and never write a stale value.
 */
export class ResourceVariableService {
	private plugin: Plugin;
	private getSettings: () => StyleContextSettings;
	private enabled = false;
	private listenersRegistered = false;

	/** Full property names this service currently publishes. */
	private setVars = new Set<string>();

	constructor(plugin: Plugin, getSettings: () => StyleContextSettings) {
		this.plugin = plugin;
		this.getSettings = getSettings;
	}

	/**
	 * Registers rename/delete listeners to re-resolve affected vars and
	 * applies immediately. Idempotent.
	 */
	enable(): void {
		if (this.enabled) return;
		this.enabled = true;

		if (!this.listenersRegistered) {
			this.listenersRegistered = true;
			const { vault, workspace } = this.plugin.app;
			this.plugin.registerEvent(
				vault.on('rename', () => this.apply()),
			);
			this.plugin.registerEvent(
				vault.on('delete', () => this.apply()),
			);
			workspace?.onLayoutReady(() => this.apply());
		}

		this.apply();
	}

	/**
 * Removes all variables this service published.
	 */
	disable(): void {
		this.enabled = false;
		this.clearAll();
	}

	/**
	 * Re-resolves every enabled resource rule. Always clears prior values
	 * first so stale URLs never linger. The variable name is published
	 * verbatim — no prefix is added.
	 */
	apply(): void {
		this.clearAll();
		if (!this.enabled) return;

		const rules = this.getSettings().resourceRules;
		for (const rule of rules) {
			if (!rule.enabled) continue;
			const prop = rule.variableName;
			const file = this.resolveFile(rule);
			if (!file) {
				// Do not write a bad value; error surfaced via current().
				continue;
			}
			const url = this.plugin.app.vault.getResourcePath(file);
			activeDocument.documentElement.style.setProperty(
				prop,
				`url(${JSON.stringify(url)})`,
			);
			this.setVars.add(prop);
		}
	}

	private resolveFile(rule: ResourceRule): TFile | null {
		const path = normalizePath(rule.filePath);
		if (path.length === 0) return null;
		const abstract = this.plugin.app.vault.getAbstractFileByPath(path);
		if (abstract instanceof TFile) return abstract;
		return null;
	}

	private clearAll(): void {
		for (const property of this.setVars) {
			activeDocument.documentElement.style.removeProperty(property);
		}
		this.setVars.clear();
	}

	/**
	 * Returns the resolution status of every enabled resource rule for
	 * the diagnostics panel.
	 */
	current(): ResourceResolution[] {
		const result: ResourceResolution[] = [];
		const rules = this.getSettings().resourceRules;
		for (const rule of rules) {
			if (!rule.enabled) continue;
			const prop = rule.variableName;
			const path = normalizePath(rule.filePath);
			const entry: ResourceResolution = {
				ruleId: rule.id,
				variableName: prop,
				resolved: false,
			};
			if (path.length === 0) {
				entry.error = 'File path is empty';
			} else {
				const file = this.resolveFile(rule);
				if (!file) {
					entry.error = `File not found: ${path}`;
				} else {
					entry.resolved = this.setVars.has(prop);
				}
			}
			result.push(entry);
		}
		return result;
	}
}
