import type { Plugin } from 'obsidian';
import { LEGACY_THEME_CLASS_PREFIX, DEFAULT_THEME_SLUG } from '../constants';
import type { StyleContextSettings } from '../types';
import { themeSlug } from '../utils/slug';
import { readThemeName } from '../utils/internals';
import { getAppDocuments } from '../utils/documents';

export interface ThemeContextSnapshot {
	rawName: string;
	slug: string;
	prefix: string;
	appliedClass: string;
	selector: string;
}

/**
 * SC-01: Publishes the current theme name as a single configurable-prefix
 * `<prefix><slug>` class on the document body. Idempotent: applying
 * multiple times leaves exactly one theme class.
 */
export class ThemeContextService {
	private plugin: Plugin;
	private getSettings: () => StyleContextSettings;
	private enabled = false;
	private listenersRegistered = false;

	/** Tracks every theme class this service has added to each window body. */
	private appliedClasses = new Map<Document, Set<string>>();

	constructor(plugin: Plugin, getSettings: () => StyleContextSettings) {
		this.plugin = plugin;
		this.getSettings = getSettings;
	}

	/**
	 * Registers the css-change listener (fires on theme switch and any
	 * snippet/theme reload) and applies the current theme immediately.
	 * Idempotent: calling while already enabled is a no-op.
	 */
	enable(): void {
		if (this.enabled) return;
		this.enabled = true;
		if (!this.listenersRegistered) {
			this.listenersRegistered = true;
			this.plugin.registerEvent(
				this.plugin.app.workspace.on('css-change', () => {
					if (this.enabled) this.apply();
				}),
			);
		}
		this.apply();
	}

	/**
	 * Removes any theme class this service applied. Listener cleanup is
	 * handled by the plugin's register* lifecycle.
	 */
	disable(): void {
		this.enabled = false;
		this.removeAllTrackedClasses();
		this.sweepLegacyClasses();
	}

	/**
	 * Applies the current theme class to the body. Removes all previously
	 * tracked classes first so prefix changes never leave stale state.
	 * Also sweeps legacy `sc-theme-*` classes from older deployments.
	 */
	apply(): void {
		const { slug } = this.resolve();
		const prefix = this.getSettings().themeClassPrefix;

		this.removeAllTrackedClasses();
		this.sweepLegacyClasses();

		const cls = prefix + slug;
		for (const targetDocument of getAppDocuments(this.plugin.app)) {
			targetDocument.body.classList.add(cls);
			this.appliedClasses.set(targetDocument, new Set([cls]));
		}
	}

	/**
	 * Returns the full CSS selector for the current theme, e.g.
	 * `"body.theme-mod-terminal-workbench"`.
	 */
	currentSelector(): string {
		const { slug } = this.resolve();
		const prefix = this.getSettings().themeClassPrefix;
		return `body.${prefix}${slug}`;
	}

	private resolve(): { rawName: string; slug: string } {
		const rawName = readThemeName(this.plugin.app);
		const effective =
			!rawName || rawName === 'default' ? DEFAULT_THEME_SLUG : rawName;
		return { rawName, slug: themeSlug(effective) };
	}

	private removeAllTrackedClasses(): void {
		for (const [targetDocument, classes] of this.appliedClasses) {
			targetDocument.body.classList.remove(...classes);
		}
		this.appliedClasses.clear();
	}

	/**
	 * Back-compat sweep: removes any `sc-theme-*` classes left by the
	 * previous deployment that used a hardcoded prefix. Idempotent and
	 * cheap; kept forever (harmless once old classes are gone).
	 */
	private sweepLegacyClasses(): void {
		for (const targetDocument of getAppDocuments(this.plugin.app)) {
			const legacy = Array.from(targetDocument.body.classList).filter((c) =>
				c.startsWith(LEGACY_THEME_CLASS_PREFIX),
			);
			if (legacy.length > 0) {
				targetDocument.body.classList.remove(...legacy);
			}
		}
	}

	/**
	 * Returns the current theme context for the diagnostics panel and
	 * the copy-snapshot command.
	 */
	current(): ThemeContextSnapshot {
		const { rawName, slug } = this.resolve();
		const prefix = this.getSettings().themeClassPrefix;
		const appliedClass = prefix + slug;
		return {
			rawName,
			slug,
			prefix,
			appliedClass,
			selector: `body.${appliedClass}`,
		};
	}
}
