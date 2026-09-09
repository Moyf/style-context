import { describe, expect, it, beforeEach } from 'vitest';
import { isImageFile } from '../src/utils/media';
import {
	isBareBackgroundImageVariable,
	isValidBackgroundImageValue,
	normalizeBackgroundImageValue,
	pickRandomBackgroundImageValue,
	randomScopeIcon,
	randomizeBackgroundImageValue,
	resolveBackgroundImageMode,
} from '../src/utils/background';
import { DEFAULT_SETTINGS, type ResourceRule, type StyleContextSettings } from '../src/types';
import { themeSlug } from '../src/utils/slug';
import {
	areValidClassNames,
	isValidClassName,
	isValidCssVarName,
	isValidThemePrefix,
	parseClassNames,
} from '../src/utils/validation';

describe('themeSlug', () => {
	it.each([
		['Brutal Gum', 'brutal-gum'],
		['  MY__Theme!!! ', 'my-theme'],
		['***', 'default'],
	])('converts %j to %j', (input, expected) => {
		expect(themeSlug(input)).toBe(expected);
	});
});

describe('CSS name validation', () => {
	it('accepts conservative valid names', () => {
		expect(isValidClassName('note-context_2')).toBe(true);
		expect(isValidCssVarName('--hero-image')).toBe(true);
		expect(isValidThemePrefix('theme-mod-')).toBe(true);
	});

	it('rejects invalid names', () => {
		expect(isValidClassName('2notes')).toBe(false);
		expect(isValidCssVarName('hero-image')).toBe(false);
		expect(isValidCssVarName('--2hero')).toBe(false);
		expect(isValidThemePrefix('-theme-')).toBe(false);
	});

	it('parses class lists deterministically', () => {
		expect(parseClassNames(' note, focus, note, , focus ')).toEqual([
			'note',
			'focus',
		]);
		expect(areValidClassNames('note, focus')).toBe(true);
		expect(areValidClassNames('note, 2focus')).toBe(false);
	});
});

describe('isImageFile', () => {
	it('matches supported extensions case-insensitively', () => {
		expect(isImageFile({ extension: 'PNG' } as never)).toBe(true);
		expect(isImageFile({ extension: 'pdf' } as never)).toBe(false);
	});
});

describe('randomScopeIcon', () => {
	it('maps each scope to its Lucide icon', () => {
		expect(randomScopeIcon('all')).toBe('dices');
		expect(randomScopeIcon('light')).toBe('sun');
		expect(randomScopeIcon('dark')).toBe('moon');
		expect(randomScopeIcon('none')).toBe('circle-slash');
	});
});

describe('resolveBackgroundImageMode', () => {
	it.each([
		['theme-light', 'light'],
		['theme-dark', 'dark'],
	])('reads %j as the document mode', (bodyClass, expected) => {
		document.body.classList.remove('theme-light', 'theme-dark');
		document.body.classList.add(bodyClass);
		expect(resolveBackgroundImageMode(document)).toBe(expected);
	});

	it('returns "any" for a document without a theme class', () => {
		document.body.classList.remove('theme-light', 'theme-dark');
		expect(resolveBackgroundImageMode(document)).toBe('any');
	});
});

describe('pickRandomBackgroundImageValue', () => {
	const rules: ResourceRule[] = [
			{ id: 'one', filePath: 'one.png', variableName: '--one', enabled: true, useForBackgroundImage: true },
			{ id: 'two', filePath: 'two.png', variableName: '--two', enabled: true, useForBackgroundImage: true },
			{ id: 'disabled', filePath: 'off.png', variableName: '--off', enabled: false, useForBackgroundImage: true },
			{ id: 'excluded', filePath: 'excluded.png', variableName: '--excluded', enabled: true, randomScope: 'none' },
			{ id: 'invalid', filePath: 'bad.png', variableName: 'bad', enabled: true, useForBackgroundImage: true },
	];

	it('chooses from enabled valid variables and avoids the current value', () => {
		expect(pickRandomBackgroundImageValue(rules, 'var(--one)', () => 0)).toBe(
			'var(--two)',
		);
	});

	it('returns null when no usable image variables exist', () => {
		expect(
			pickRandomBackgroundImageValue([
					{ id: 'off', filePath: 'off.png', variableName: '--off', enabled: false, useForBackgroundImage: true },
			]),
		).toBeNull();
	});

	describe('random scope filtering', () => {
		const scoped: ResourceRule[] = [
				{ id: 'all', filePath: 'all.png', variableName: '--all', enabled: true, randomScope: 'all' },
				{ id: 'light', filePath: 'light.png', variableName: '--light-only', enabled: true, randomScope: 'light' },
				{ id: 'dark', filePath: 'dark.png', variableName: '--dark-only', enabled: true, randomScope: 'dark' },
				{ id: 'none', filePath: 'none.png', variableName: '--never', enabled: true, randomScope: 'none' },
		];

		it('mode any keeps mode-scoped images eligible but drops "none"', () => {
			// Pool (rules order): --all, --light-only, --dark-only.
			expect(pickRandomBackgroundImageValue(scoped, '', () => 0)).toBe('var(--all)');
			// Current value excluded, index 0 of remaining two.
			expect(pickRandomBackgroundImageValue(scoped, 'var(--all)', () => 0)).toBe('var(--light-only)');
			// Last slot of the full pool.
			expect(pickRandomBackgroundImageValue(scoped, '', () => 0.999)).toBe('var(--dark-only)');
		});

		it('light mode pools only "all" and "light" images', () => {
			expect(pickRandomBackgroundImageValue(scoped, '', () => 0, 'light')).toBe('var(--all)');
			expect(pickRandomBackgroundImageValue(scoped, 'var(--all)', () => 0, 'light')).toBe('var(--light-only)');
		});

		it('dark mode pools only "all" and "dark" images', () => {
			expect(pickRandomBackgroundImageValue(scoped, '', () => 0, 'dark')).toBe('var(--all)');
			expect(pickRandomBackgroundImageValue(scoped, 'var(--all)', () => 0, 'dark')).toBe('var(--dark-only)');
		});

		it('returns null when no candidate matches the mode', () => {
			expect(
				pickRandomBackgroundImageValue(
					[{ id: 'l', filePath: 'l.png', variableName: '--light-only', enabled: true, randomScope: 'light' }],
					'',
					() => 0,
					'dark',
				),
			).toBeNull();
		});

		it('defaults rules without randomScope to "all" (legacy flag is migrated in loadSettings)', () => {
			expect(
				pickRandomBackgroundImageValue(
					[{ id: 'old', filePath: 'old.png', variableName: '--old', enabled: true, useForBackgroundImage: false }],
					'',
					() => 0,
				),
			).toBe('var(--old)');
		});

		it('randomizeBackgroundImageValue applies the document mode to the pool', () => {
			const settings: StyleContextSettings = {
				...DEFAULT_SETTINGS,
				resourceRules: [
					{ id: 'l', filePath: 'l.png', variableName: '--light-only', enabled: true, randomScope: 'light' },
					{ id: 'd', filePath: 'd.png', variableName: '--dark-only', enabled: true, randomScope: 'dark' },
				],
			};
			document.body.classList.add('theme-dark');
			expect(randomizeBackgroundImageValue(settings, document, () => 0)).toBe('var(--dark-only)');

			document.body.classList.remove('theme-dark');
			document.body.classList.add('theme-light');
			expect(randomizeBackgroundImageValue(settings, document, () => 0)).toBe('var(--light-only)');

			// Unknown mode: both scoped images stay eligible. The previous pick
			// is stored as the current value, so each call flips to the other.
			document.body.classList.remove('theme-light');
			expect(randomizeBackgroundImageValue(settings, document, () => 0)).toBe('var(--dark-only)');
			expect(randomizeBackgroundImageValue(settings, document, () => 0)).toBe('var(--light-only)');
		});
	});
});

describe('background image values', () => {
	it('trims complete expressions without changing their meaning', () => {
		expect(normalizeBackgroundImageValue(' var(--hero-image) ')).toBe(
			'var(--hero-image)',
		);
		expect(
			normalizeBackgroundImageValue('url("https://example.com/hero.jpg")'),
		).toBe('url("https://example.com/hero.jpg")');
	});

	it('accepts image expressions and rejects plain invalid tokens', () => {
		expect(isValidBackgroundImageValue('var(--hero-image)')).toBe(true);
		expect(
			isValidBackgroundImageValue('url("https://example.com/hero.jpg")'),
		).toBe(true);
		expect(isValidBackgroundImageValue('--hero-image')).toBe(false);
		expect(isValidBackgroundImageValue('hero-image')).toBe(false);
	});

	it('recognizes bare custom properties that need var()', () => {
		expect(isBareBackgroundImageVariable(' --hero-image ')).toBe(true);
		expect(isBareBackgroundImageVariable('var(--hero-image)')).toBe(false);
		expect(isBareBackgroundImageVariable('hero-image')).toBe(false);
	});
});

describe('randomizeBackgroundImageValue', () => {
	function perModeSettings(): StyleContextSettings {
		return {
			...DEFAULT_SETTINGS,
			resourceRules: [
				{ id: 'one', filePath: 'one.png', variableName: '--one', enabled: true, useForBackgroundImage: true },
				{ id: 'two', filePath: 'two.png', variableName: '--two', enabled: true, useForBackgroundImage: true },
			],
			backgroundImage: {
				...DEFAULT_SETTINGS.backgroundImage,
				enabled: true,
				imageValue: 'var(--global)',
				perModeEnabled: true,
				light: {
					...DEFAULT_SETTINGS.backgroundImage.light,
					imageValue: 'var(--one)',
				},
				dark: {
					...DEFAULT_SETTINGS.backgroundImage.dark,
					imageValue: 'var(--one)',
				},
			},
		};
	}

	beforeEach(() => {
		document.body.classList.remove('theme-light', 'theme-dark');
	});

	it('updates only the light config for a theme-light document', () => {
		const current = perModeSettings();
		document.body.classList.add('theme-light');

		// The light config's current value is excluded, leaving one candidate.
		const value = randomizeBackgroundImageValue(current, document, () => 0);

		expect(value).toBe('var(--two)');
		expect(current.backgroundImage.light.imageValue).toBe('var(--two)');
		expect(current.backgroundImage.dark.imageValue).toBe('var(--one)');
		expect(current.backgroundImage.imageValue).toBe('var(--global)');
	});

	it('updates only the dark config for a theme-dark document', () => {
		const current = perModeSettings();
		document.body.classList.add('theme-dark');

		const value = randomizeBackgroundImageValue(current, document, () => 0);

		expect(value).toBe('var(--two)');
		expect(current.backgroundImage.dark.imageValue).toBe('var(--two)');
		expect(current.backgroundImage.light.imageValue).toBe('var(--one)');
		expect(current.backgroundImage.imageValue).toBe('var(--global)');
	});

	it('falls back to the global config for a document with neither theme class', () => {
		const current = perModeSettings();

		const value = randomizeBackgroundImageValue(current, document, () => 0.999);

		expect(value).toBe('var(--two)');
		expect(current.backgroundImage.imageValue).toBe('var(--two)');
		expect(current.backgroundImage.light.imageValue).toBe('var(--one)');
		expect(current.backgroundImage.dark.imageValue).toBe('var(--one)');
	});

	it('targets the global config while per-mode is disabled, even with a theme class', () => {
		const current = perModeSettings();
		current.backgroundImage.perModeEnabled = false;
		document.body.classList.add('theme-light');

		const value = randomizeBackgroundImageValue(current, document, () => 0.999);

		expect(value).toBe('var(--two)');
		expect(current.backgroundImage.imageValue).toBe('var(--two)');
		expect(current.backgroundImage.light.imageValue).toBe('var(--one)');
		expect(current.backgroundImage.dark.imageValue).toBe('var(--one)');
	});

	it('returns null and mutates nothing when no image variable is eligible', () => {
		const current = perModeSettings();
		current.resourceRules = [];
		document.body.classList.add('theme-dark');

		expect(randomizeBackgroundImageValue(current, document, () => 0)).toBeNull();
		expect(current.backgroundImage.imageValue).toBe('var(--global)');
		expect(current.backgroundImage.light.imageValue).toBe('var(--one)');
		expect(current.backgroundImage.dark.imageValue).toBe('var(--one)');
	});
});
