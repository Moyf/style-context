import type { Plugin } from 'obsidian';
import { MarkdownView, normalizePath } from 'obsidian';
import type { StyleContextSettings, PathRule } from '../types';
import { parseClassNames } from '../utils/validation';

export interface NotePathLeafSnapshot {
	leafPath: string;
	appliedClass: string | null;
	matchedRuleId: string | null;
}

/**
 * SC-02: Adds one or more user-configured CSS classes (comma-separated
 * in the rule) to each Markdown view's container based on the first
 * matching folder-path-prefix rule. Classes are tracked per-view so
 * cleanup is precise and never touches classes owned by other plugins.
 */
export class NotePathContextService {
	private plugin: Plugin;
	private getSettings: () => StyleContextSettings;
	private enabled = false;
	private listenersRegistered = false;

	/**
	 * Tracks the classes (and the rule that produced them) this service
	 * last added to a given container element.
	 */
	private applied = new WeakMap<
		HTMLElement,
		{ classes: string[]; ruleId: string }
	>();

	constructor(plugin: Plugin, getSettings: () => StyleContextSettings) {
		this.plugin = plugin;
		this.getSettings = getSettings;
	}

	/**
	 * Registers workspace/vault listeners and sweeps existing leaves.
	 * Idempotent: re-enabling cleans prior state first.
	 */
	enable(): void {
		if (this.enabled) return;
		this.enabled = true;

		if (!this.listenersRegistered) {
			this.listenersRegistered = true;
			const { workspace, vault } = this.plugin.app;

			this.plugin.registerEvent(
				workspace.on('file-open', () => this.applyToActiveMarkdown()),
			);
			this.plugin.registerEvent(
				workspace.on('active-leaf-change', () => this.sweepAll()),
			);
			// Run an initial sweep once the workspace layout is ready (safe to
			// call immediately if already ready).
			workspace.onLayoutReady(() => this.sweepAll());
			this.plugin.registerEvent(
				vault.on('rename', () => this.sweepAll()),
			);
		}

		this.sweepAll();
	}

	/**
	 * Removes every class this service applied from all Markdown leaves.
	 */
	disable(): void {
		this.enabled = false;
		this.clearAll();
	}

	/**
	 * Strips the tracked class from every open Markdown view container.
	 */
	clearAll(): void {
		const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				this.stripTracked(view.containerEl);
			}
		}
	}

	/**
	 * Re-evaluates all open Markdown leaves: applies a class where a rule
	 * matches and strips stale classes where it no longer does.
	 */
	sweepAll(): void {
		if (!this.enabled) return;
		const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				this.applyToView(view);
			}
		}
	}

	private applyToActiveMarkdown(): void {
		if (!this.enabled) return;
		const view =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (view instanceof MarkdownView) {
			this.applyToView(view);
		}
	}

	/**
	 * Computes the matching rule for a view and swaps the tracked classes.
	 * Always strips previously-tracked classes before applying new ones.
	 * A rule's className may be a comma-separated list; empty / invalid
	 * parses result in no classes being applied.
	 */
	applyToView(view: MarkdownView): void {
		const file = view.file;
		const container = view.containerEl;

		// Always remove the classes we previously added to this container.
		this.stripTracked(container);

		if (!file) return;

		const rule = this.matchRule(file.path);
		if (!rule) return;

		const classes = parseClassNames(rule.className);
		if (classes.length === 0) return;

		container.classList.add(...classes);
		this.applied.set(container, { classes, ruleId: rule.id });
	}

	private matchRule(path: string): PathRule | undefined {
		const normalized = normalizePath(path);
		const lower = normalized.toLowerCase();
		const rules = this.getSettings().pathRules;
		for (const rule of rules) {
			if (!rule.enabled) continue;
			const pattern = rule.pattern;
			if (pattern.length === 0) continue;
			if (rule.matchMode === 'keyword') {
				// Keyword mode: case-insensitive substring match anywhere
				// in the path (folder names + filename).
				if (lower.includes(pattern.toLowerCase())) {
					return rule;
				}
			} else {
				// Folder mode: path-prefix match.
				const prefix = normalizePath(pattern);
				if (prefix.length === 0) continue;
				if (normalized.startsWith(prefix)) {
					return rule;
				}
			}
		}
		return undefined;
	}

	private stripTracked(container: HTMLElement): void {
		const prev = this.applied.get(container);
		if (prev) {
			container.classList.remove(...prev.classes);
			this.applied.delete(container);
		}
	}

	/**
	 * Returns the current per-leaf class assignment for diagnostics.
	 * `appliedClass` is the comma-joined string of applied classes
	 * (or null when no rule matched).
	 */
	current(): NotePathLeafSnapshot[] {
		const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
		const result: NotePathLeafSnapshot[] = [];
		for (const leaf of leaves) {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) continue;
			const file = view.file;
			const leafPath = file ? file.path : '';
			const tracked = this.applied.get(view.containerEl);
			const appliedClass = tracked ? tracked.classes.join(', ') : null;
			const matchedRuleId = tracked ? tracked.ruleId : null;
			result.push({ leafPath, appliedClass, matchedRuleId });
		}
		return result;
	}
}
