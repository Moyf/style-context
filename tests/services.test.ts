import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile, MarkdownView } from './mocks/obsidian';
import { DEFAULT_SETTINGS, type StyleContextSettings } from '../src/types';
import { ThemeContextService } from '../src/services/ThemeContextService';
import { ResourceVariableService } from '../src/services/ResourceVariableService';
import { NotePathContextService } from '../src/services/NotePathContextService';

type ListenerMap = Map<string, () => void>;

function createEventSource(listeners: ListenerMap) {
	return vi.fn((event: string, callback: () => void) => {
		listeners.set(event, callback);
		return { event, callback };
	});
}

function settings(
	overrides: Partial<StyleContextSettings> = {},
): StyleContextSettings {
	return { ...DEFAULT_SETTINGS, ...overrides };
}

beforeEach(() => {
	document.documentElement.removeAttribute('style');
	Object.defineProperty(globalThis, 'activeDocument', {
		configurable: true,
		value: document,
	});
});

describe('ThemeContextService', () => {
	it('cleans up when disabled and does not duplicate its listener', () => {
		const listeners: ListenerMap = new Map();
		const themeWindowDocument = document.implementation.createHTMLDocument(
			'Theme',
		);
		const workspace = { on: createEventSource(listeners) };
		const plugin = {
			app: {
				workspace,
				customCss: { theme: 'Brutal Gum' },
				vault: { getConfig: vi.fn() },
			},
			registerEvent: vi.fn(),
		};
		const service = new ThemeContextService(plugin as never, () => settings());

		service.enable();
		expect(document.body.classList.contains('theme-mod-brutal-gum')).toBe(true);
		expect(workspace.on).toHaveBeenCalledTimes(3);
		service.applyToDocument(themeWindowDocument);
		expect(
			themeWindowDocument.body.classList.contains('theme-mod-brutal-gum'),
		).toBe(true);

		service.disable();
		listeners.get('css-change')?.();
		expect(document.body.classList.contains('theme-mod-brutal-gum')).toBe(false);
		expect(
			themeWindowDocument.body.classList.contains('theme-mod-brutal-gum'),
		).toBe(false);

		service.enable();
		expect(workspace.on).toHaveBeenCalledTimes(3);
		expect(service.currentSelector()).toBe('body.theme-mod-brutal-gum');
	});
});

describe('ResourceVariableService', () => {
	it('publishes valid resources, reports missing files, and registers once', () => {
		const listeners: ListenerMap = new Map();
		const workspaceListeners: ListenerMap = new Map();
		const settingsWindowDocument = document.implementation.createHTMLDocument(
			'Settings',
		);
		const file = new TFile('assets/Hero.PNG');
		const files = new Map([[file.path, file]]);
		const vault = {
			on: createEventSource(listeners),
			getAbstractFileByPath: vi.fn((path: string) => files.get(path) ?? null),
			getResourcePath: vi.fn((target: TFile) => `app://vault/${target.path}`),
		};
		const workspace = {
			rootSplit: { doc: document },
			on: createEventSource(workspaceListeners),
		};
		const plugin = { app: { vault, workspace }, registerEvent: vi.fn() };
		const currentSettings = settings({
			resourceRules: [
				{
					id: 'hero',
					filePath: 'assets/Hero.PNG',
					variableName: '--hero-image',
					enabled: true,
				},
				{
					id: 'missing',
					filePath: 'assets/missing.png',
					variableName: '--missing-image',
					enabled: true,
				},
			],
		});
		const service = new ResourceVariableService(plugin as never, () => currentSettings);
		document.documentElement.style.setProperty('--external-variable', 'keep-me');

		service.enable();
		expect(document.documentElement.style.getPropertyValue('--hero-image')).toContain(
			'app://vault/assets/Hero.PNG',
		);
		expect(
			document.documentElement.style.getPropertyValue('--external-variable'),
		).toBe('keep-me');
		expect(service.current()).toEqual([
			expect.objectContaining({ variableName: '--hero-image', resolved: true }),
			expect.objectContaining({
				variableName: '--missing-image',
				resolved: false,
				error: 'File not found: assets/missing.png',
			}),
		]);
		service.applyToDocument(settingsWindowDocument);
		expect(
			settingsWindowDocument.documentElement.style.getPropertyValue('--hero-image'),
		).toContain('app://vault/assets/Hero.PNG');

		service.disable();
		expect(document.documentElement.style.getPropertyValue('--hero-image')).toBe('');
		expect(
			document.documentElement.style.getPropertyValue('--external-variable'),
		).toBe('keep-me');
		expect(
			settingsWindowDocument.documentElement.style.getPropertyValue('--hero-image'),
		).toBe('');
		service.enable();
		expect(vault.on).toHaveBeenCalledTimes(2);
	});
});

describe('NotePathContextService', () => {
	it('applies matched classes, reports them, and keeps listener registration idempotent', () => {
		const listeners: ListenerMap = new Map();
		const view = new MarkdownView(new TFile('Projects/alpha.md'));
		const workspace = {
			on: createEventSource(listeners),
			onLayoutReady: vi.fn((callback: () => void) => callback()),
			getLeavesOfType: vi.fn(() => [{ view }]),
			getActiveViewOfType: vi.fn(() => view),
		};
		const vault = { on: createEventSource(listeners) };
		const plugin = { app: { workspace, vault }, registerEvent: vi.fn() };
		const currentSettings = settings({
			pathRules: [
				{
					id: 'projects',
					matchMode: 'folder',
					pattern: 'Projects',
					className: 'project, focus',
					enabled: true,
				},
			],
		});
		const service = new NotePathContextService(plugin as never, () => currentSettings);

		service.enable();
		expect(view.containerEl.classList.contains('project')).toBe(true);
		expect(view.containerEl.classList.contains('focus')).toBe(true);
		expect(service.current()).toEqual([
			{
				leafPath: 'Projects/alpha.md',
				appliedClass: 'project, focus',
				matchedRuleId: 'projects',
			},
		]);

		service.disable();
		expect(view.containerEl.classList.contains('project')).toBe(false);
		service.enable();
		expect(workspace.on).toHaveBeenCalledTimes(2);
		expect(vault.on).toHaveBeenCalledTimes(1);
	});
});
