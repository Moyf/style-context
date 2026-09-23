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
	INTERFACE_TRANSPARENCY_SURFACES,
	applyInterfaceTransparency,
	resolveInterfaceTransparency,
	type InterfaceTransparency,
} from './InterfaceTransparency';

const BACKGROUND_IMAGE_BODY_CLASS = 'sc-style-context-background-image';
/**
 * While this class is present, the freshly shown layer is pinned to
 * opacity 0 by styles.css. It keeps the background invisible from the
 * synchronous first apply until the deferred fade-in actually starts —
 * without it, the layer would render at full opacity during the frames
 * before the animation is armed (most visibly at app startup).
 */
const BACKGROUND_IMAGE_FADE_PENDING_CLASS =
	'sc-style-context-background-image-fade-pending';
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
	/** Layer opacity transition duration; 0s keeps the layer static. */
	fadeDuration: '--sc-style-context-background-image-fade-duration',
} as const;

/** Upper bound for the persisted fade duration, in seconds. */
const MAX_FADE_DURATION_SECONDS = 2;

/**
 * How many frames the first-show reveal may wait for the plugin
 * stylesheet to apply before arming the fade anyway. Failing open only
 * risks an instant show; it can never leave the layer stuck invisible.
 */
export const MAX_FADE_STYLESHEET_WAIT_FRAMES = 120;

function resolveFadeDuration(value: unknown): number {
	const number = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(number) || number <= 0) return 0;
	return Math.min(MAX_FADE_DURATION_SECONDS, number);
}

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
 * theme canvas and uses background-blend-mode: mix-blend-mode would
 * blend against the (fully transparent) backdrop below this rearmost layer,
 * which is a no-op for every mode. The body itself is repainted with the same
 * canvas, so a faded layer cross-fades toward the theme canvas instead of
 * the bare app backdrop. Theme canvas tokens and surface resets live in
 * styles.css.
 */
export class BackgroundImageService {
	private getSettings: () => StyleContextSettings;
	private app?: App;
	private enabled = false;
	private touchedDocuments = new Set<Document>();
	/**
	 * Per-document cancellation handles for fade-ins scheduled but not yet
	 * started. A document absent from this map has no pending reveal; its
	 * layer either sits at its resolved opacity or is fading.
	 */
	private pendingFadeCancels = new Map<Document, () => void>();

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
		const fadeDuration = resolveFadeDuration(settings.fadeDuration);

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
			this.applyToDocument(
				targetDocument,
				resolved,
				transparency,
				fadeDuration,
			);
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
		this.cancelFade(targetDocument);
		targetDocument.body.classList.remove(
			BACKGROUND_IMAGE_BODY_CLASS,
			BACKGROUND_IMAGE_FADE_PENDING_CLASS,
			...Object.values(INTERFACE_TRANSPARENCY_CLASSES),
		);
		for (const property of Object.values(BACKGROUND_IMAGE_PROPERTIES)) {
			targetDocument.body.style.removeProperty(property);
		}
		this.touchedDocuments.delete(targetDocument);
	}

	/**
	 * Writes the resolved style onto one document. Only the layer's first
	 * show animates (fade-in from fully transparent); every later change —
	 * image swaps included — writes instantly, keeping slider drags live.
	 *
	 * The first-show reveal is deferred (see scheduleFadeStart): the layer
	 * is written at its final values but pinned invisible by the
	 * fade-pending class until the document has actually rendered. This
	 * keeps the inline state consistent, so the startup double-apply
	 * (randomize/applyAll) hits the no-op early return and leaves the
	 * pending reveal untouched.
	 */
	private applyToDocument(
		targetDocument: Document,
		resolved: ResolvedBackgroundImageStyle,
		transparency: InterfaceTransparency,
		fadeDuration: number,
	): void {
		const style = targetDocument.body.style;
		const hadLayer = targetDocument.body.classList.contains(
			BACKGROUND_IMAGE_BODY_CLASS,
		);

		if (
			hadLayer &&
			this.matchesWrittenState(style, resolved) &&
			this.matchesTransparencyClasses(targetDocument, transparency)
		) {
			// Nothing to write; leave a possibly pending fade-in alone.
			return;
		}

		// Instant path for every non-first show: the transition stays
		// disarmed so appearance tweaks and image swaps are immediate. Any
		// fade-in that has not started yet is superseded by this write.
		this.cancelFade(targetDocument);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.fadeDuration, '0s');
		this.writeAppearanceVariables(targetDocument, resolved);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.value, resolved.imageValue);
		targetDocument.body.classList.add(BACKGROUND_IMAGE_BODY_CLASS);
		targetDocument.body.classList.remove(BACKGROUND_IMAGE_FADE_PENDING_CLASS);
		applyInterfaceTransparency(targetDocument, transparency);
		this.touchedDocuments.add(targetDocument);

		if (!hadLayer && fadeDuration > 0) {
			// First show with a fade: pin the layer invisible now and let
			// scheduleFadeStart reveal it once the document has rendered.
			targetDocument.body.classList.add(BACKGROUND_IMAGE_FADE_PENDING_CLASS);
			this.scheduleFadeStart(targetDocument, fadeDuration);
		}
	}

	/**
	 * True when every variable already holds the resolved value — a repeat
	 * apply with nothing to write. Checked so the duration variable is not
	 * rewritten (and the running fade-in truncated) for no-op applies.
	 */
	private matchesWrittenState(
		style: CSSStyleDeclaration,
		resolved: ResolvedBackgroundImageStyle,
	): boolean {
		return (
			style.getPropertyValue(BACKGROUND_IMAGE_PROPERTIES.value) ===
				resolved.imageValue &&
			style.getPropertyValue(BACKGROUND_IMAGE_PROPERTIES.opacity) ===
				resolved.opacity &&
			style.getPropertyValue(BACKGROUND_IMAGE_PROPERTIES.inset) ===
				resolved.inset &&
			style.getPropertyValue(BACKGROUND_IMAGE_PROPERTIES.blendMode) ===
				resolved.blendMode &&
			style.getPropertyValue(BACKGROUND_IMAGE_PROPERTIES.size) === resolved.size &&
			style.getPropertyValue(BACKGROUND_IMAGE_PROPERTIES.position) ===
				resolved.position &&
			style.getPropertyValue(BACKGROUND_IMAGE_PROPERTIES.repeat) ===
				resolved.repeat &&
			style.getPropertyValue(BACKGROUND_IMAGE_PROPERTIES.attachment) ===
				resolved.attachment &&
			style.getPropertyValue(BACKGROUND_IMAGE_PROPERTIES.filter) === resolved.filter
		);
	}

	/**
 * True when the transparency classes already reflect the resolved
 * transparency, so the no-op early return also covers surface toggles.
 */
private matchesTransparencyClasses(
	targetDocument: Document,
	transparency: InterfaceTransparency,
): boolean {
	for (const surface of INTERFACE_TRANSPARENCY_SURFACES) {
		if (
			targetDocument.body.classList.contains(
				INTERFACE_TRANSPARENCY_CLASSES[surface],
			) !== transparency[surface]
		) {
			return false;
		}
	}
	return true;
}

/** Writes every non-image appearance variable for the incoming state. */
	private writeAppearanceVariables(
		targetDocument: Document,
		resolved: ResolvedBackgroundImageStyle,
	): void {
		const style = targetDocument.body.style;
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.inset, resolved.inset);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.blendMode, resolved.blendMode);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.size, resolved.size);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.position, resolved.position);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.repeat, resolved.repeat);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.attachment, resolved.attachment);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.opacity, resolved.opacity);
		setStyleProperty(style, BACKGROUND_IMAGE_PROPERTIES.filter, resolved.filter);
	}

	/**
	 * Schedules the reveal of a hidden (fade-pending) layer. The start is
	 * deliberately deferred for two reasons:
	 *
	 * 1. At app startup the workspace has not been painted yet, so a
	 *    transition armed synchronously would run (and finish) behind
	 *    Obsidian's startup work and the background would still pop in.
	 * 2. Obsidian injects a plugin's styles.css asynchronously, several
	 *    frames AFTER onload completes when the plugin is enabled. Until
	 *    it applies, the layer's pseudo-element does not exist, so there
	 *    is no hidden state to transition from — arming early would make
	 *    the background pop in the moment the stylesheet lands.
	 *
	 * The reveal therefore waits for the workspace layout, then polls per
	 * frame until the pseudo-element actually renders (always invisible:
	 * the pending class pins it to opacity 0 as soon as the stylesheet
	 * applies), then arms the duration and releases the pending class so
	 * opacity animates to the resolved value.
	 */
	private scheduleFadeStart(
		targetDocument: Document,
		fadeDuration: number,
	): void {
		const view = targetDocument.defaultView;
		if (!view || typeof view.requestAnimationFrame !== 'function') {
			// No renderer (e.g. detached test documents); reveal at once.
			this.startFadeIn(targetDocument, fadeDuration);
			return;
		}
		let cancelled = false;
		this.pendingFadeCancels.set(targetDocument, () => {
			cancelled = true;
		});
		let framesWaited = 0;
		const reveal = (): void => {
			if (cancelled) return;
			if (
				framesWaited <= MAX_FADE_STYLESHEET_WAIT_FRAMES &&
				!this.layerRendered(targetDocument, view)
			) {
				framesWaited += 1;
				view.requestAnimationFrame(reveal);
				return;
			}
			// One more frame so the hidden state is rendered before the
			// transition is armed, guaranteeing a visible animation.
			view.requestAnimationFrame(() => {
				if (cancelled) return;
				this.pendingFadeCancels.delete(targetDocument);
				this.startFadeIn(targetDocument, fadeDuration);
			});
		};
		const workspace = this.app?.workspace;
		if (workspace && !workspace.layoutReady) {
			workspace.onLayoutReady(() => {
				if (!cancelled) reveal();
			});
			return;
		}
		reveal();
	}

	/**
	 * True when the plugin stylesheet is applied and the background layer's
	 * pseudo-element actually renders. Reading the computed style also
	 * forces a style recalculation, committing the hidden state as the
	 * transition's before-change style.
	 */
	private layerRendered(targetDocument: Document, view: Window): boolean {
		try {
			const pseudo = view.getComputedStyle(targetDocument.body, '::before');
			return !pseudo || pseudo.content !== 'none';
		} catch {
			// Probe unavailable in this environment: never block the reveal.
			return true;
		}
	}

	/**
	 * Reveals a fade-pending layer: arms the transition duration and
	 * releases the pending class so opacity animates from 0 to the resolved
	 * value. The inline appearance variables already hold the target state.
	 */
	private startFadeIn(targetDocument: Document, fadeDuration: number): void {
		setStyleProperty(
			targetDocument.body.style,
			BACKGROUND_IMAGE_PROPERTIES.fadeDuration,
			`${fadeDuration}s`,
		);
		targetDocument.body.classList.remove(BACKGROUND_IMAGE_FADE_PENDING_CLASS);
	}

	/** Cancels a scheduled (not yet started) fade-in for a document. */
	private cancelFade(targetDocument: Document): void {
		this.pendingFadeCancels.get(targetDocument)?.();
		this.pendingFadeCancels.delete(targetDocument);
	}

	/** Exposes the selected variable for diagnostics and tests. */
	currentImageValue(): string {
		const settings = this.getSettings().backgroundImage;
		return this.enabled && settings?.enabled
			? normalizeBackgroundImageValue(settings.imageValue)
			: '';
	}
}
