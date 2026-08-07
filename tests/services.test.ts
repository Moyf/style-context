import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile, MarkdownView } from './mocks/obsidian';
import { DEFAULT_SETTINGS, type StyleContextSettings } from '../src/types';
import { ThemeContextService } from '../src/services/ThemeContextService';
import { ResourceVariableService } from '../src/services/ResourceVariableService';
import { NotePathContextService } from '../src/services/NotePathContextService';
import { BackgroundImageService } from '../src/services/BackgroundImageService';

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
	document.body.removeAttribute('style');
	document.body.classList.remove('sc-style-context-background-image');
	Object.defineProperty(globalThis, 'activeDocument', {
		configurable: true,
		value: document,
	});
});

describe('BackgroundImageService', () => {
	it('synchronizes background styles across the main and detached Settings documents', () => {
		const settingsDocument = document.implementation.createHTMLDocument('Settings');
		Object.defineProperty(globalThis, 'activeDocument', {
			configurable: true,
			value: settingsDocument,
		});
		const currentSettings = settings({
			backgroundImage: {
				...DEFAULT_SETTINGS.backgroundImage,
				enabled: true,
				imageValue: 'var(--image-1)',
				opacity: 0.6,
			},
		});
		const service = new BackgroundImageService(() => currentSettings);

		service.enable();

		for (const targetDocument of [document, settingsDocument]) {
			expect(
				targetDocument.body.style.getPropertyValue(
					'--sc-style-context-background-image-opacity',
				),
			).toBe('0.6');
			expect(
				targetDocument.body.classList.contains(
					'sc-style-context-background-image',
				),
			).toBe(true);
		}
	});

	it('keeps background styles inactive when the setting is disabled', () => {
		const service = new BackgroundImageService(() => settings());

		service.enable();

		expect(
			document.body.classList.contains('sc-style-context-background-image'),
		).toBe(false);
		expect(document.body.getAttribute('style')).toBeNull();
	});

	it('renders the selected variable in an isolated, configurable layer', () => {
		const currentSettings = settings({
			backgroundImage: {
				enabled: true,
				imageValue: 'var(--image-1)',
				opacity: 0.6,
				blendMode: 'multiply',
				size: 'contain',
				position: 'top right',
				repeat: 'repeat',
				attachment: 'scroll',
				filter: {
					brightness: 1.2,
					contrast: 1,
					saturate: 1,
					grayscale: 0,
					sepia: 0,
					invert: 0,
					hueRotate: 0,
					blur: 4,
				},
			},
		});
		const service = new BackgroundImageService(() => currentSettings);

		service.enable();

		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-value',
			),
		).toBe('var(--image-1)');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-opacity',
			),
		).toBe('0.6');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-blend-mode',
			),
		).toBe('multiply');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-size',
			),
		).toBe('contain');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-position',
			),
		).toBe('top right');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-repeat',
			),
		).toBe('repeat');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-attachment',
			),
		).toBe('scroll');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-filter',
			),
		).toBe('brightness(1.2) blur(4px)');
		// The layer grows by the blur radius so softened edges stay off-canvas.
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-inset',
			),
		).toBe('-4px');
		expect(document.body.classList.contains('sc-style-context-background-image')).toBe(true);
		expect(service.currentImageValue()).toBe('var(--image-1)');

		service.disable();
		expect(document.body.classList.contains('sc-style-context-background-image')).toBe(false);
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-value',
			),
		).toBe('');
		expect(service.currentImageValue()).toBe('');
	});

	it('omits the filter rule while every filter sits at its neutral default', () => {
		const currentSettings = settings({
			backgroundImage: {
				...DEFAULT_SETTINGS.backgroundImage,
				enabled: true,
				imageValue: 'var(--image-1)',
			},
		});
		const service = new BackgroundImageService(() => currentSettings);

		service.enable();

		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-value',
			),
		).toBe('var(--image-1)');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-filter',
			),
		).toBe('none');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-inset',
			),
		).toBe('0');
	});

	it('accepts a remote URL as a complete CSS image value', () => {
		const currentSettings = settings({
			backgroundImage: {
				...DEFAULT_SETTINGS.backgroundImage,
				enabled: true,
				imageValue: 'url("https://example.com/hero.jpg")',
			},
		});
		const service = new BackgroundImageService(() => currentSettings);

		service.enable();

		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-value',
			),
		).toBe('url("https://example.com/hero.jpg")');
		expect(document.body.classList.contains('sc-style-context-background-image')).toBe(true);
	});

	it('paints the canvas with the theme color so zero opacity falls back to it', () => {
		const currentSettings = settings({
			backgroundImage: {
				...DEFAULT_SETTINGS.backgroundImage,
				enabled: true,
				imageValue: 'var(--image-1)',
				opacity: 0,
			},
		});
		const service = new BackgroundImageService(() => currentSettings);

		service.enable();

		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-opacity',
			),
		).toBe('0');
	});

	it('does not inject a layer for an empty or invalid variable', () => {
		const currentSettings = settings({
			backgroundImage: {
				...DEFAULT_SETTINGS.backgroundImage,
				enabled: true,
				imageValue: 'image-1',
			},
		});
		const service = new BackgroundImageService(() => currentSettings);

		service.enable();

		expect(document.body.classList.contains('sc-style-context-background-image')).toBe(false);
		expect(document.body.getAttribute('style')).toBeNull();
	});

	it('sanitizes persisted advanced options before writing CSS', () => {
		const currentSettings = settings({
			backgroundImage: {
				...DEFAULT_SETTINGS.backgroundImage,
				enabled: true,
				imageValue: 'var(--image-1)',
				opacity: 4,
				blendMode: 'not-a-mode' as never,
				size: 'bad-size' as never,
				position: 'bad-position' as never,
				repeat: 'bad-repeat' as never,
				attachment: 'bad-attachment' as never,
				filter: {
					brightness: 99,
					contrast: Number.NaN,
					saturate: 'loud' as never,
					grayscale: -1,
					sepia: 2,
					invert: 0.5,
					hueRotate: 720,
					blur: -4,
				},
			},
		});
		const service = new BackgroundImageService(() => currentSettings);

		service.enable();

		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-opacity',
			),
		).toBe('1');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-blend-mode',
			),
		).toBe('normal');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-size',
			),
		).toBe('cover');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-position',
			),
		).toBe('center');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-repeat',
			),
		).toBe('no-repeat');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-attachment',
			),
		).toBe('fixed');
		// Out-of-range filters clamp into range; unparseable ones fall back
		// to neutral defaults and drop out of the filter list entirely.
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-filter',
			),
		).toBe('brightness(2) sepia(1) invert(0.5) hue-rotate(360deg)');
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-inset',
			),
		).toBe('0');
	});
});

describe('ThemeContextService', () => {
	it('cleans up when disabled and does not duplicate its listener', () => {
		const listeners: ListenerMap = new Map();
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
		expect(workspace.on).toHaveBeenCalledTimes(1);

		service.disable();
		listeners.get('css-change')?.();
		expect(document.body.classList.contains('theme-mod-brutal-gum')).toBe(false);

		service.enable();
		expect(workspace.on).toHaveBeenCalledTimes(1);
		expect(service.currentSelector()).toBe('body.theme-mod-brutal-gum');
	});
});

describe('ResourceVariableService', () => {
	it('publishes valid resources, reports missing files, and registers once', () => {
		const settingsDocument = document.implementation.createHTMLDocument('Settings');
		Object.defineProperty(globalThis, 'activeDocument', {
			configurable: true,
			value: settingsDocument,
		});
		const listeners: ListenerMap = new Map();
		const file = new TFile('assets/Hero.PNG');
		const files = new Map([[file.path, file]]);
		const vault = {
			on: createEventSource(listeners),
			getAbstractFileByPath: vi.fn((path: string) => files.get(path) ?? null),
			getResourcePath: vi.fn((target: TFile) => `app://vault/${target.path}`),
		};
		const plugin = { app: { vault }, registerEvent: vi.fn() };
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
		expect(
			document.documentElement.style.getPropertyValue('--hero-image'),
		).toBe('url("app://vault/assets/Hero.PNG")');
		expect(
			settingsDocument.documentElement.style.getPropertyValue('--hero-image'),
		).toBe('url("app://vault/assets/Hero.PNG")');
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

		service.disable();
		expect(
			document.documentElement.style.getPropertyValue('--hero-image'),
		).toBe('');
		expect(
			settingsDocument.documentElement.style.getPropertyValue('--hero-image'),
		).toBe('');
		expect(
			document.documentElement.style.getPropertyValue('--external-variable'),
		).toBe('keep-me');
		service.enable();
		expect(vault.on).toHaveBeenCalledTimes(2);
	});

	it('re-resolves resources after the initial workspace layout is ready', () => {
		const files = new Map<string, TFile>();
		let onLayoutReady: (() => void) | undefined;
		const workspace = {
			onLayoutReady: vi.fn((callback: () => void) => {
				onLayoutReady = callback;
			}),
		};
		const vault = {
			on: createEventSource(new Map()),
			getAbstractFileByPath: vi.fn((path: string) => files.get(path) ?? null),
			getResourcePath: vi.fn((file: TFile) => `app://vault/${file.path}`),
		};
		const plugin = { app: { vault, workspace }, registerEvent: vi.fn() };
		const service = new ResourceVariableService(
			plugin as never,
			() =>
				settings({
					resourceRules: [
						{
							id: 'hero',
							filePath: 'assets/Hero.PNG',
							variableName: '--hero-image',
							enabled: true,
						},
					],
				}),
		);

		service.enable();
		expect(
			document.documentElement.style.getPropertyValue('--hero-image'),
		).toBe('');

		files.set('assets/Hero.PNG', new TFile('assets/Hero.PNG'));
		onLayoutReady?.();

		expect(
			document.documentElement.style.getPropertyValue('--hero-image'),
		).toBe('url("app://vault/assets/Hero.PNG")');
		expect(workspace.onLayoutReady).toHaveBeenCalledTimes(1);
	});

	it('publishes into a newly rendered Settings document before it becomes active', () => {
		const file = new TFile('assets/Hero.PNG');
		const vault = {
			on: createEventSource(new Map()),
			getAbstractFileByPath: vi.fn(() => file),
			getResourcePath: vi.fn(() => 'app://vault/assets/Hero.PNG'),
		};
		const plugin = { app: { vault }, registerEvent: vi.fn() };
		const service = new ResourceVariableService(
			plugin as never,
			() =>
				settings({
					resourceRules: [
						{
							id: 'hero',
							filePath: 'assets/Hero.PNG',
							variableName: '--hero-image',
							enabled: true,
						},
					],
				}),
		);
		const settingsDocument = document.implementation.createHTMLDocument('Settings');

		service.enable();
		service.applyToDocument(settingsDocument);

		expect(
			settingsDocument.documentElement.style.getPropertyValue('--hero-image'),
		).toBe('url("app://vault/assets/Hero.PNG")');
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
