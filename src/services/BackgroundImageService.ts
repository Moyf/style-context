import type { App } from 'obsidian';
import {
	BACKGROUND_ATTACHMENT_OPTIONS,
	BACKGROUND_BLEND_MODES,
	BACKGROUND_POSITION_OPTIONS,
	BACKGROUND_REPEAT_OPTIONS,
	BACKGROUND_SIZE_OPTIONS,
} from '../constants';
import {
	DEFAULT_SETTINGS,
	type BackgroundFilterSettings,
	type BackgroundImageSettings,
	type BackgroundModeSettings,
	type StyleContextSettings,
} from '../types';
import {
	isValidBackgroundImageValue,
	normalizeBackgroundImageValue,
	resolveBackgroundImageConfig,
} from '../utils/background';
import { getAppDocuments } from '../utils/documents';
import {
	INTERFACE_TRANSPARENCY_CLASSES,
	applyInterfaceTransparency,
	resolveInterfaceTransparency,
	type InterfaceTransparency,
} from './InterfaceTransparency';

const BACKGROUND_IMAGE_BODY_CLASS = 'sc-style-context-background-image';
const BACKGROUND_IMAGE_PROPERTIES = {
	value: '--sc-style-context-background-image-value',
	inset: '--sc-style-context-background-image-inset',
	blendMode: '--sc-style-context-background-image-blend-mode',
	size: '--sc-style-context-background-image-size',
	position: '--sc-style-context-background-image-position',
	repeat: '--sc-style-context-background-image-repeat',
	attachment: '--sc-style-context-background-image-attachment',
	opacity: '--sc-style-context-background-image-opacity',
	filter: '--sc-style-context-background-image-filter',
} as const;

type StringOptions = readonly string[];

function setStyleProperty(
	style: CSSStyleDeclaration,
	property: string,
	value: string,
): void {
	if (style.getPropertyValue(property) !== value) {
		style.setProperty(property, value);
	}
}

export interface ResolvedBackgroundImageStyle {
	imageValue: string;
	inset: string;
	blendMode: string;
	size: string;
	position: string;
	repeat: string;
	attachment: string;
	opacity: string;
	filter: string;
}

function optionOrDefault(
	value: unknown,
	options: StringOptions,
	defaultValue: string,
): string {
	return typeof value === 'string' && options.includes(value)
		? value
		: defaultValue;
}

function safeOpacity(value: unknown): number {
	const number = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(number)) return 0.35;
	return Math.min(1, Math.max(0, number));
}

function clampFinite(
	value: unknown,
	min: number,
	max: number,
	fallback: number,
): number {
	const number = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(number)) return fallback;
	return Math.min(max, Math.max(min, number));
}

/**
 * Sanitizes persisted filter values. Stored data may predate the filter
 * settings (or contain hand-edited values), so anything unusable falls back
 * to the neutral default instead of producing invalid CSS.
 */
function resolveFilter(
	filter: BackgroundFilterSettings | undefined,
): BackgroundFilterSettings {
	const defaults = DEFAULT_SETTINGS.backgroundImage.filter;
	const source = filter ?? defaults;
	return {
		brightness: clampFinite(source.brightness, 0, 2, defaults.brightness),
		contrast: clampFinite(source.contrast, 0, 2, defaults.contrast),
		saturate: clampFinite(source.saturate, 0, 2, defaults.saturate),
		grayscale: clampFinite(source.grayscale, 0, 1, defaults.grayscale),
		sepia: clampFinite(source.sepia, 0, 1, defaults.sepia),
		invert: clampFinite(source.invert, 0, 1, defaults.invert),
		hueRotate: clampFinite(source.hueRotate, 0, 360, defaults.hueRotate),
		blur: clampFinite(source.blur, 0, 20, defaults.blur),
	};
}

/** Neutral values are omitted so the layer carries no `filter` at all by default. */
function buildFilterCss(filter: BackgroundFilterSettings): string {
	const parts: string[] = [];
	if (filter.brightness !== 1) parts.push(`brightness(${filter.brightness})`);
	if (filter.contrast !== 1) parts.push(`contrast(${filter.contrast})`);
	if (filter.saturate !== 1) parts.push(`saturate(${filter.saturate})`);
	if (filter.grayscale !== 0) parts.push(`grayscale(${filter.grayscale})`);
	if (filter.sepia !== 0) parts.push(`sepia(${filter.sepia})`);
	if (filter.invert !== 0) parts.push(`invert(${filter.invert})`);
	if (filter.hueRotate !== 0) parts.push(`hue-rotate(${filter.hueRotate}deg)`);
	if (filter.blur !== 0) parts.push(`blur(${filter.blur}px)`);
	return parts.join(' ');
}

/** Resolves persisted settings into the sanitized CSS shared by canvas and preview. */
export function resolveBackgroundImageStyle(
	settings: BackgroundModeSettings,
): ResolvedBackgroundImageStyle | null {
	const imageValue = normalizeBackgroundImageValue(settings.imageValue);
	if (!isValidBackgroundImageValue(imageValue)) return null;

	const blendMode = optionOrDefault(
		settings.blendMode,
		BACKGROUND_BLEND_MODES,
		'normal',
	);
	const size = optionOrDefault(settings.size, BACKGROUND_SIZE_OPTIONS, 'cover');
	const position = optionOrDefault(
		settings.position,
		BACKGROUND_POSITION_OPTIONS,
		'center',
	);
	const repeat = optionOrDefault(
		settings.repeat,
		BACKGROUND_REPEAT_OPTIONS,
		'no-repeat',
	);
	const attachment = optionOrDefault(
		settings.attachment,
		BACKGROUND_ATTACHMENT_OPTIONS,
		'fixed',
	);
	const filter = resolveFilter(settings.filter);
	const filterCss = buildFilterCss(filter);

	return {
		imageValue,
		inset: filter.blur > 0 ? `-${Math.ceil(filter.blur)}px` : '0',
		blendMode,
		size,
		position,
		repeat,
		attachment,
		opacity: String(safeOpacity(settings.opacity)),
		filter: filterCss || 'none',
	};
}

/**
 * Applies a published image variable to the Obsidian canvas. The image is
 * rendered in a fixed, pointer-free pseudo-element so opacity and blend mode
 * do not also reduce the opacity of notes and controls. The layer carries the
 * theme canvas color and uses background-blend-mode: mix-blend-mode would
 * blend against the (fully transparent) backdrop below this rearmost layer,
 * which is a no-op for every mode. The body itself is repainted with the same
 * canvas color, so a faded layer cross-fades toward the theme color — at zero
 * opacity the canvas falls back to the theme's canvas color instead of the
 * bare app backdrop.
 */
export class BackgroundImageService {
	private getSettings: () => StyleContextSettings;
	private app?: App;
	private enabled = false;
	private touchedDocuments = new Set<Document>();

	constructor(getSettings: () => StyleContextSettings, app?: App) {
		this.getSettings = getSettings;
		this.app = app;
	}

	enable(): void {
		if (this.enabled) return;
		this.enabled = true;
		this.apply();
	}

	disable(): void {
		this.enabled = false;
		this.clear();
	}

	apply(): void {
		if (!this.enabled) {
			this.clear();
			return;
		}

		const settings = this.getSettings().backgroundImage;
		if (!settings?.enabled) {
			this.clear();
			return;
		}

		const transparency = resolveInterfaceTransparency(settings);

		// Include previously touched documents so an unfocused detached
		// window still follows mode/config changes, exactly like clear().
		for (const targetDocument of new Set([
			...this.touchedDocuments,
			...getAppDocuments(this.app),
		])) {
			const resolved = this.resolveForDocument(settings, targetDocument);
			if (!resolved) {
				this.clearDocument(targetDocument);
				continue;
			}
			this.applyToDocument(targetDocument, resolved, transparency);
		}
	}

	/**
	 * Resolves one document's style through the shared per-mode resolver.
	 * An empty/invalid resolved image value makes apply() clear that
	 * document's layer instead of borrowing the other mode's image.
	 */
	private resolveForDocument(
		settings: BackgroundImageSettings,
		targetDocument: Document,
	): ResolvedBackgroundImageStyle | null {
		return resolveBackgroundImageStyle(
			resolveBackgroundImageConfig(settings, targetDocument),
		);
	}

	private clear(): void {
		for (const targetDocument of new Set([
			...this.touchedDocuments,
			...getAppDocuments(this.app),
		])) {
			this.clearDocument(targetDocument);
		}
		this.touchedDocuments.clear();
	}

	private clearDocument(targetDocument: Document): void {
		targetDocument.body.classList.remove(
			BACKGROUND_IMAGE_BODY_CLASS,
			...Object.values(INTERFACE_TRANSPARENCY_CLASSES),
		);
		for (const property of Object.values(BACKGROUND_IMAGE_PROPERTIES)) {
			targetDocument.body.style.removeProperty(property);
		}
		this.touchedDocuments.delete(targetDocument);
	}

	private applyToDocument(
		targetDocument: Document,
		resolved: ResolvedBackgroundImageStyle,
		transparency: InterfaceTransparency,
	): void {
		const style = targetDocument.body.style;
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.value, resolved.imageValue);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.inset, resolved.inset);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.blendMode, resolved.blendMode);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.size, resolved.size);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.position, resolved.position);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.repeat, resolved.repeat);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.attachment, resolved.attachment);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.opacity, resolved.opacity);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.filter, resolved.filter);
		targetDocument.body.classList.add(BACKGROUND_IMAGE_BODY_CLASS);
		applyInterfaceTransparency(targetDocument, transparency);
		this.touchedDocuments.add(targetDocument);
	}

	/** Exposes the selected variable for diagnostics and tests. */
	currentImageValue(): string {
		const settings = this.getSettings().backgroundImage;
		return this.enabled && settings?.enabled
			? normalizeBackgroundImageValue(settings.imageValue)
			: '';
	}
}
