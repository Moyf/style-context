import { describe, expect, it } from 'vitest';
import { isImageFile } from '../src/utils/media';
import {
	isBareBackgroundImageVariable,
	isValidBackgroundImageValue,
	normalizeBackgroundImageValue,
	pickRandomBackgroundImageValue,
	referencesImageVariable,
} from '../src/utils/background';
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

describe('pickRandomBackgroundImageValue', () => {
	const rules = [
		{ id: 'one', filePath: 'one.png', variableName: '--one', enabled: true },
		{ id: 'two', filePath: 'two.png', variableName: '--two', enabled: true },
		{ id: 'disabled', filePath: 'off.png', variableName: '--off', enabled: false },
		{ id: 'invalid', filePath: 'bad.png', variableName: 'bad', enabled: true },
	];

	it('chooses from enabled valid variables and avoids the current value', () => {
		expect(pickRandomBackgroundImageValue(rules, 'var(--one)', () => 0)).toBe(
			'var(--two)',
		);
	});

	it('returns null when no usable image variables exist', () => {
		expect(
			pickRandomBackgroundImageValue([
				{ id: 'off', filePath: 'off.png', variableName: '--off', enabled: false },
			]),
		).toBeNull();
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

	it('detects only bare matching background var() values', () => {
		const variables = ['--hero-image', '--cover-image'];

		expect(referencesImageVariable(' var( --hero-image ) ', variables)).toBe(true);
		expect(referencesImageVariable('var(--cover-image)', variables)).toBe(true);
		expect(referencesImageVariable('url(var(--hero-image))', variables)).toBe(false);
		expect(referencesImageVariable('var(--hero-image), var(--cover-image)', variables)).toBe(false);
		expect(referencesImageVariable('linear-gradient(red, blue)', variables)).toBe(false);
		expect(referencesImageVariable('none', variables)).toBe(false);
		expect(referencesImageVariable('var(--other-image)', variables)).toBe(false);
		expect(referencesImageVariable('--hero-image', variables)).toBe(false);
		expect(referencesImageVariable(null, variables)).toBe(false);
	});
});
