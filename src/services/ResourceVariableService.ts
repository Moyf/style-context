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
 * as user-defined CSS variables on :root. Missing files produce
 * a clear error and never write a stale value.
 */
export class ResourceVariableService {
	private plugin: Plugin;
	private getSettings: () => StyleContextSettings;
	private enabled = false;
	private listenersRegistered = false;

	/** Full property names this service currently has set on :root. */
	private setVars = new Set<string>();
	/** Every document that needs the runtime CSS variables (main + popouts). */
	private documents = new Set<Document>();

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
		this.documents.add(this.getMainDocument());

		if (!this.listenersRegistered) {
			this.listenersRegistered = true;
			const { vault, workspace } = this.plugin.app;
			this.plugin.registerEvent(
				vault.on('rename', () => this.apply()),
			);
			this.plugin.registerEvent(
				vault.on('delete', () => this.apply()),
			);
			if (workspace) {
				this.plugin.registerEvent(
					workspace.on('window-open', (_workspaceWindow, win) =>
						this.applyToDocument(win.document),
					),
				);
				this.plugin.registerEvent(
					workspace.on('window-close', (_workspaceWindow, win) =>
						this.releaseDocument(win.document),
					),
				);
			}
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

		this.documents.add(this.getMainDocument());
		const values = this.resolveValues();
		this.setVars = new Set(values.keys());
		for (const document of this.documents) {
			this.publishToDocument(document, values);
		}
	}

	/**
	 * Makes runtime variables available in a document that was created after
	 * the main window, such as a popout Settings window.
	 */
	applyToDocument(document: Document): void {
		this.documents.add(document);
		if (!this.enabled) return;

		this.clearDocument(document);
		const values = this.resolveValues();
		for (const property of values.keys()) this.setVars.add(property);
		this.publishToDocument(document, values);
	}

	/** Removes a closed transient document from the publication set. */
	releaseDocument(document: Document): void {
		if (document === this.getMainDocument()) return;
		this.clearDocument(document);
		this.documents.delete(document);
	}

	private resolveFile(rule: ResourceRule): TFile | null {
		const path = normalizePath(rule.filePath);
		if (path.length === 0) return null;
		const abstract = this.plugin.app.vault.getAbstractFileByPath(path);
		if (abstract instanceof TFile) return abstract;
		return null;
	}

	private clearAll(): void {
		for (const document of this.documents) this.clearDocument(document);
		this.setVars.clear();
	}

	private getMainDocument(): Document {
		return this.plugin.app.workspace?.rootSplit?.doc ?? activeDocument;
	}

	private resolveValues(): Map<string, string> {
		const values = new Map<string, string>();
		for (const rule of this.getSettings().resourceRules) {
			if (!rule.enabled) continue;
			const file = this.resolveFile(rule);
			if (!file) continue;
			const url = this.plugin.app.vault.getResourcePath(file);
			values.set(rule.variableName, `url("${url}")`);
		}
		return values;
	}

	private publishToDocument(
		document: Document,
		values: Map<string, string>,
	): void {
		for (const [property, value] of values) {
			document.documentElement.style.setProperty(property, value);
		}
	}

	private clearDocument(document: Document): void {
		for (const property of this.setVars) {
			document.documentElement.style.removeProperty(property);
		}
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
