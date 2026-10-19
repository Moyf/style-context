import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/types';
import { resolveBackgroundImageStyle } from '../src/services/BackgroundImageService';

const config = { ...DEFAULT_SETTINGS.backgroundImage, imageValue: 'var(--image-1)' };

describe('background color overlay', () => {
	it('keeps legacy settings transparent and leaves the image filters independent', () => {
		const { overlayEnabled, overlayColor, overlayOpacity, overlayBlendMode, ...legacy } = config;
		expect(resolveBackgroundImageStyle(legacy as typeof config)).toMatchObject({
			overlayOpacity: '0', overlayBlendMode: 'normal', overlayColor: '#000000', imageValue: 'var(--image-1)',
		});
		expect(resolveBackgroundImageStyle({ ...config, overlayEnabled: true,
			overlayColor: '#ff8000', overlayOpacity: 0.6, overlayBlendMode: 'multiply',
			filter: { ...config.filter, grayscale: 1 },
		})).toMatchObject({ overlayColor: '#ff8000', overlayOpacity: '0.6', overlayBlendMode: 'multiply', filter: 'grayscale(1)' });
	});

	it.each([
		[2, '1'], [-1, '0'], [NaN, '0.3'], [Infinity, '0.3'],
	])('sanitizes persisted opacity %s', (value, expected) => {
		expect(resolveBackgroundImageStyle({ ...config, overlayEnabled: true,
			overlayOpacity: value, overlayBlendMode: 'invalid' as typeof config.overlayBlendMode, overlayColor: 'red; color: blue',
		})).toMatchObject({ overlayOpacity: expected, overlayBlendMode: 'normal', overlayColor: '#000000' });
	});
});
