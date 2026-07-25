import type { Plugin } from 'obsidian';
import { LEGACY_THEME_CLASS_PREFIX, DEFAULT_THEME_SLUG } from '../constants';
import type { StyleContextSettings } from '../types';
import { themeSlug } from '../utils/slug';
import { readThemeName } from '../utils/internals';

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

	/** Every document that needs the theme context (main + popouts). */
	private documents = new Set<Document>();
	/** Tracks every theme class this service has added, per document. */
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
		this.documents.add(this.getMainDocument());
		if (!this.listenersRegistered) {
			this.listenersRegistered = true;
			this.plugin.registerEvent(
				this.plugin.app.workspace.on('css-change', () => {
					if (this.enabled) this.apply();
				}),
			);
			this.plugin.registerEvent(
				this.plugin.app.workspace.on('window-open', (_workspaceWindow, win) =>
					this.applyToDocument(win.document),
				),
			);
			this.plugin.registerEvent(
				this.plugin.app.workspace.on('window-close', (_workspaceWindow, win) =>
					this.releaseDocument(win.document),
				),
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
		this.documents.add(this.getMainDocument());
		for (const document of this.documents) {
			document.body.classList.add(cls);
			this.appliedClasses.set(document, new Set([cls]));
		}
	}

	/** Publishes the current theme class to a newly-created window. */
	applyToDocument(document: Document): void {
		this.documents.add(document);
		if (!this.enabled) return;

		this.removeTrackedClasses(document);
		this.sweepLegacyClasses(document);
		const { slug } = this.resolve();
		const cls = this.getSettings().themeClassPrefix + slug;
		document.body.classList.add(cls);
		this.appliedClasses.set(document, new Set([cls]));
	}

	/** Removes a closed transient document from the publication set. */
	releaseDocument(document: Document): void {
		if (document === this.getMainDocument()) return;
		this.removeTrackedClasses(document);
		this.documents.delete(document);
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
		for (const document of this.appliedClasses.keys()) {
			this.removeTrackedClasses(document);
		}
	}

	private removeTrackedClasses(document: Document): void {
		const classes = this.appliedClasses.get(document);
		if (!classes) return;
		document.body.classList.remove(...classes);
		this.appliedClasses.delete(document);
	}

	/**
	 * Back-compat sweep: removes any `sc-theme-*` classes left by the
	 * previous deployment that used a hardcoded prefix. Idempotent and
	 * cheap; kept forever (harmless once old classes are gone).
	 */
	private sweepLegacyClasses(document?: Document): void {
		const documents = document ? [document] : this.documents;
		for (const currentDocument of documents) {
			const legacy = Array.from(currentDocument.body.classList).filter((c) =>
				c.startsWith(LEGACY_THEME_CLASS_PREFIX),
			);
			if (legacy.length > 0) {
				currentDocument.body.classList.remove(...legacy);
			}
		}
	}

	private getMainDocument(): Document {
		return this.plugin.app.workspace?.rootSplit?.doc ?? activeDocument;
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
