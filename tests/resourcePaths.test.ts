import { describe, expect, it } from 'vitest';
import type { ResourceRule } from '../src/types';
import {
	remapResourcePath,
	rewriteResourcePaths,
} from '../src/utils/resourcePaths';

function rule(
	id: string,
	filePath: string,
	variableName = `--${id}`,
	enabled = true,
): ResourceRule {
	return { id, filePath, variableName, enabled };
}

describe('remapResourcePath', () => {
	it('rewrites exact file renames and cross-folder moves', () => {
		// Given: a stored image path matching the vault rename source.
		// When: Obsidian reports the file at its new path.
		// Then: the stored path follows the moved file.
		expect(
			remapResourcePath('assets/Hero.PNG', 'assets/Hero.PNG', 'media/Banner.PNG'),
		).toBe('media/Banner.PNG');
		expect(
			remapResourcePath('inbox/Hero.PNG', 'inbox/Hero.PNG', 'archive/Hero.PNG'),
		).toBe('archive/Hero.PNG');
	});

	it('rewrites folder descendants and the folder path itself', () => {
		// Given: resource rules stored below a folder path.
		// When: the folder is renamed.
		// Then: exact and descendant paths move under the new folder.
		expect(remapResourcePath('assets/img', 'assets/img', 'media/pics')).toBe(
			'media/pics',
		);
		expect(
			remapResourcePath('assets/img/deep/Icon.png', 'assets/img', 'media/pics'),
		).toBe('media/pics/deep/Icon.png');
	});

	it('does not rewrite sibling prefixes or unrelated paths', () => {
		// Given: paths that only look similar to the renamed folder.
		// When: the old path is a prefix without a slash boundary.
		// Then: no rewrite happens.
		expect(remapResourcePath('assets/imgx/Icon.png', 'assets/img', 'media/pics')).toBeNull();
		expect(remapResourcePath('other/Icon.png', 'assets/img', 'media/pics')).toBeNull();
	});

	it('ignores empty inputs and idempotent no-ops', () => {
		// Given: missing or already-updated path inputs.
		// When: remapping cannot produce a meaningful change.
		// Then: null signals no update.
		expect(remapResourcePath('', 'assets/Hero.PNG', 'media/Banner.PNG')).toBeNull();
		expect(remapResourcePath('assets/Hero.PNG', '', 'media/Banner.PNG')).toBeNull();
		expect(remapResourcePath('assets/Hero.PNG', 'assets/Hero.PNG', '')).toBeNull();
		expect(remapResourcePath('media/Banner.PNG', 'media/Banner.PNG', 'media/Banner.PNG')).toBeNull();
	});

	it('normalizes stored, old, and new paths before matching', () => {
		// Given: paths with platform separators and redundant slashes.
		// When: the same logical path is renamed.
		// Then: the persisted result uses normalized vault paths.
		expect(
			remapResourcePath('assets\\img//Hero.PNG', '/assets/img', 'media\\pics/'),
		).toBe('media/pics/Hero.PNG');
	});
});

describe('rewriteResourcePaths', () => {
	it('mutates enabled and disabled matching rules and reports updated variables', () => {
		// Given: active and disabled rules below the renamed folder.
		const rules = [
			rule('hero', 'assets/img/Hero.PNG', '--hero-image'),
			rule('disabled', 'assets/img/Old.PNG', '--disabled-image', false),
			rule('sibling', 'assets/imgx/Other.PNG', '--other-image'),
		];

		// When: the containing folder is renamed.
		const result = rewriteResourcePaths(rules, 'assets/img', 'media/pics');

		// Then: only exact descendants update, including disabled rules.
		expect(rules.map((item) => item.filePath)).toEqual([
			'media/pics/Hero.PNG',
			'media/pics/Old.PNG',
			'assets/imgx/Other.PNG',
		]);
		expect(result).toEqual({
			updates: [
				{
					ruleId: 'hero',
					variableName: '--hero-image',
					previousPath: 'assets/img/Hero.PNG',
					nextPath: 'media/pics/Hero.PNG',
				},
				{
					ruleId: 'disabled',
					variableName: '--disabled-image',
					previousPath: 'assets/img/Old.PNG',
					nextPath: 'media/pics/Old.PNG',
				},
			],
			updatedVariableNames: ['--hero-image', '--disabled-image'],
		});
	});

	it('returns null and leaves rules untouched when nothing matches', () => {
		// Given: a resource rule outside the renamed path.
		const rules = [rule('hero', 'assets/Hero.PNG', '--hero-image')];

		// When: a different path is renamed.
		const result = rewriteResourcePaths(rules, 'notes/Journal.md', 'notes/Diary.md');

		// Then: settings are untouched and no update is reported.
		expect(result).toBeNull();
		expect(rules[0]?.filePath).toBe('assets/Hero.PNG');
	});

	it('converges when folder and child rename events are delivered in either order', () => {
		// Given: two equivalent event orders for a moved folder and a moved child.
		const folderFirst = [rule('hero', 'assets/img/Hero.PNG', '--hero-image')];
		const childFirst = [rule('hero', 'assets/img/Hero.PNG', '--hero-image')];

		// When: the events are applied in opposite order.
		rewriteResourcePaths(folderFirst, 'assets/img', 'media/pics');
		rewriteResourcePaths(folderFirst, 'assets/img/Hero.PNG', 'media/pics/Hero.PNG');
		rewriteResourcePaths(childFirst, 'assets/img/Hero.PNG', 'media/pics/Hero.PNG');
		rewriteResourcePaths(childFirst, 'assets/img', 'media/pics');

		// Then: both sequences reach the same normalized stored path.
		expect(folderFirst[0]?.filePath).toBe('media/pics/Hero.PNG');
		expect(childFirst[0]?.filePath).toBe('media/pics/Hero.PNG');
	});
});
