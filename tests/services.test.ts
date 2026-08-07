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
	document.getElementById('style-context-background-image')?.remove();
	document.body.classList.remove('sc-style-context-background-image');
	document.getElementById('style-context-resources')?.remove();
	Object.defineProperty(globalThis, 'activeDocument', {
		configurable: true,
		value: document,
	});
});

describe('BackgroundImageService', () => {
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

		const style = document.getElementById('style-context-background-image');
		expect(style?.textContent).toContain(
			'background-image: var(--sc-style-context-background-image-value)',
		);
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-value',
			),
		).toBe('var(--image-1)');
		expect(style?.textContent).toContain('opacity: 0.6');
		expect(style?.textContent).toContain('background-blend-mode: multiply');
		expect(style?.textContent).toContain('background-size: contain');
		expect(style?.textContent).toContain('background-position: top right');
		expect(style?.textContent).toContain('background-repeat: repeat');
		expect(style?.textContent).toContain('background-attachment: scroll');
		expect(style?.textContent).toContain('filter: brightness(1.2) blur(4px)');
		// The layer grows by the blur radius so softened edges stay off-canvas.
		expect(style?.textContent).toContain('inset: -4px');
		expect(document.body.classList.contains('sc-style-context-background-image')).toBe(true);
		expect(service.currentImageValue()).toBe('var(--image-1)');

		service.disable();
		expect(document.getElementById('style-context-background-image')).toBeNull();
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

		const css = document.getElementById('style-context-background-image')?.textContent;
		expect(css).toContain(
			'background-image: var(--sc-style-context-background-image-value)',
		);
		expect(
			document.body.style.getPropertyValue(
				'--sc-style-context-background-image-value',
			),
		).toBe('var(--image-1)');
		expect(css).not.toContain('filter:');
		expect(css).toContain('inset: 0');
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
		expect(document.getElementById('style-context-background-image')).not.toBeNull();
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

		const css = document.getElementById('style-context-background-image')?.textContent;
		expect(css).toContain('opacity: 0');
		expect(css).toContain('background-color: var(--background-primary) !important');
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

		expect(document.getElementById('style-context-background-image')).toBeNull();
		expect(document.body.classList.contains('sc-style-context-background-image')).toBe(false);
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

		const css = document.getElementById('style-context-background-image')?.textContent;
		expect(css).toContain('opacity: 1');
		expect(css).toContain('background-blend-mode: normal');
		expect(css).toContain('background-size: cover');
		expect(css).toContain('background-position: center');
		expect(css).toContain('background-repeat: no-repeat');
		expect(css).toContain('background-attachment: fixed');
		// Out-of-range filters clamp into range; unparseable ones fall back
		// to neutral defaults and drop out of the filter list entirely.
		expect(css).toContain(
			'filter: brightness(2) sepia(1) invert(0.5) hue-rotate(360deg)',
		);
		expect(css).toContain('inset: 0');
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
		expect(document.getElementById('style-context-resources')?.textContent).toContain(
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

		service.disable();
		expect(document.getElementById('style-context-resources')).toBeNull();
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
		expect(document.getElementById('style-context-resources')).toBeNull();

		files.set('assets/Hero.PNG', new TFile('assets/Hero.PNG'));
		onLayoutReady?.();

		expect(document.getElementById('style-context-resources')?.textContent).toContain(
			'app://vault/assets/Hero.PNG',
		);
		expect(workspace.onLayoutReady).toHaveBeenCalledTimes(1);
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
