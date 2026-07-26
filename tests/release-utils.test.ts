import { describe, expect, it } from 'vitest';
import {
	assertNextVersion,
	prepareVersionMetadata,
	promoteUnreleased,
} from '../scripts/release-utils.mjs';

describe('release utilities', () => {
	it('synchronizes release metadata and preserves the compatibility mapping', () => {
		const metadata = prepareVersionMetadata({
			packageJson: '{"version":"0.2.0"}',
			packageLock: '{"version":"0.2.0","packages":{"":{"version":"0.2.0"}}}',
			manifest: '{"version":"0.2.0","minAppVersion":"1.13.0"}',
			versions: '{"0.2.0":"1.8.7"}',
		}, '0.3.0');

		expect(JSON.parse(metadata.packageJson).version).toBe('0.3.0');
		expect(JSON.parse(metadata.packageLock).packages[''].version).toBe('0.3.0');
		expect(JSON.parse(metadata.manifest).version).toBe('0.3.0');
		expect(JSON.parse(metadata.versions)['0.3.0']).toBe('1.13.0');
	});

	it('rejects a reused or non-increasing version', () => {
		expect(() => assertNextVersion('0.2.0', '0.2.0')).toThrow('greater');
		expect(() => assertNextVersion('0.2.0', '0.1.9')).toThrow('greater');
		expect(() => prepareVersionMetadata({
			packageJson: '{"version":"0.2.0"}',
			packageLock: '{"version":"0.2.0","packages":{"":{"version":"0.2.0"}}}',
			manifest: '{"version":"0.2.0","minAppVersion":"1.8.7"}',
			versions: '{"0.2.0":"1.8.7","0.3.0":"1.8.7"}',
		}, '0.3.0')).toThrow('already contains');
	});

	it('promotes a non-empty Unreleased section to a dated version', () => {
		const changelog = '# Changelog\n\n---\n\n## [Unreleased]\n\n### Added\n\n- Feature\n\n---\n\n## [0.2.0] - 2026-07-26\n';
		expect(promoteUnreleased(changelog, '0.3.0', '2026-07-27')).toContain(
			'## [0.3.0] - 2026-07-27',
		);
		expect(() => promoteUnreleased('# Changelog\n', '0.3.0', '2026-07-27')).toThrow('Unreleased');
	});
});
