import { describe, expect, it } from 'vitest';
import { isImageFile } from '../src/utils/media';
import { pickRandomImageVariable } from '../src/utils/background';
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

describe('pickRandomImageVariable', () => {
	const rules = [
		{ id: 'one', filePath: 'one.png', variableName: '--one', enabled: true },
		{ id: 'two', filePath: 'two.png', variableName: '--two', enabled: true },
		{ id: 'disabled', filePath: 'off.png', variableName: '--off', enabled: false },
		{ id: 'invalid', filePath: 'bad.png', variableName: 'bad', enabled: true },
	];

	it('chooses from enabled valid variables and avoids the current value', () => {
		expect(pickRandomImageVariable(rules, '--one', () => 0)).toBe('--two');
	});

	it('returns null when no usable image variables exist', () => {
		expect(
			pickRandomImageVariable([
				{ id: 'off', filePath: 'off.png', variableName: '--off', enabled: false },
			]),
		).toBeNull();
	});
});
