import {
	BACKGROUND_ATTACHMENT_OPTIONS,
	BACKGROUND_BLEND_MODES,
	BACKGROUND_POSITION_OPTIONS,
	BACKGROUND_REPEAT_OPTIONS,
	BACKGROUND_SIZE_OPTIONS,
} from '../constants';
import type { StyleContextSettings } from '../types';
import { isValidCssVarName } from '../utils/validation';

export const BACKGROUND_IMAGE_STYLE_ID = 'style-context-background-image';
const BACKGROUND_IMAGE_BODY_CLASS = 'sc-style-context-background-image';

type StringOptions = readonly string[];

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

/**
 * Applies a published image variable to the Obsidian canvas. The image is
 * rendered in a fixed, pointer-free pseudo-element so opacity and blend mode
 * do not also reduce the opacity of notes and controls. The layer carries the
 * theme canvas color and uses background-blend-mode: mix-blend-mode would
 * blend against the (fully transparent) backdrop below this rearmost layer,
 * which is a no-op for every mode.
 */
export class BackgroundImageService {
	private getSettings: () => StyleContextSettings;
	private enabled = false;

	constructor(getSettings: () => StyleContextSettings) {
		this.getSettings = getSettings;
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
		this.clear();
		if (!this.enabled) return;

		const settings = this.getSettings().backgroundImage;
		if (!settings?.enabled || !isValidCssVarName(settings.variableName)) return;

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

		const style = activeDocument.createElement('style');
		style.id = BACKGROUND_IMAGE_STYLE_ID;
		style.textContent = `
/* Style Context background image layer */
body.${BACKGROUND_IMAGE_BODY_CLASS} {
	background-color: transparent !important;
	background-image: none !important;
}

body.${BACKGROUND_IMAGE_BODY_CLASS}::before {
	content: "";
	position: fixed;
	inset: 0;
	pointer-events: none;
	z-index: -1;
	background-image: var(${settings.variableName});
	background-color: var(--background-primary);
	background-blend-mode: ${blendMode};
	background-size: ${size};
	background-position: ${position};
	background-repeat: ${repeat};
	background-attachment: ${attachment};
	opacity: ${safeOpacity(settings.opacity)};
}

/* Let the fixed layer flow through Obsidian's standard canvas containers. */
body.${BACKGROUND_IMAGE_BODY_CLASS} .app-container,
body.${BACKGROUND_IMAGE_BODY_CLASS} .workspace,
body.${BACKGROUND_IMAGE_BODY_CLASS} .workspace-split,
body.${BACKGROUND_IMAGE_BODY_CLASS} .workspace-tab-container,
body.${BACKGROUND_IMAGE_BODY_CLASS} .workspace-leaf,
body.${BACKGROUND_IMAGE_BODY_CLASS} .workspace-leaf-content,
body.${BACKGROUND_IMAGE_BODY_CLASS} .view-content,
body.${BACKGROUND_IMAGE_BODY_CLASS} .view-header,
body.${BACKGROUND_IMAGE_BODY_CLASS} .workspace-tab-header-container,
body.${BACKGROUND_IMAGE_BODY_CLASS} .workspace-tabs,
body.${BACKGROUND_IMAGE_BODY_CLASS} .workspace-ribbon,
body.${BACKGROUND_IMAGE_BODY_CLASS} .titlebar,
body.${BACKGROUND_IMAGE_BODY_CLASS} .titlebar-inner,
body.${BACKGROUND_IMAGE_BODY_CLASS} .titlebar-button-container,
body.${BACKGROUND_IMAGE_BODY_CLASS} .sidebar-toggle-button,
body.${BACKGROUND_IMAGE_BODY_CLASS} .nav-files-container {
	background-color: transparent !important;
	background-image: none !important;
}
`;

		activeDocument.head.appendChild(style);
		activeDocument.body.classList.add(BACKGROUND_IMAGE_BODY_CLASS);
	}

	private clear(): void {
		activeDocument.getElementById(BACKGROUND_IMAGE_STYLE_ID)?.remove();
		activeDocument.body.classList.remove(BACKGROUND_IMAGE_BODY_CLASS);
	}

	/** Exposes the selected variable for diagnostics and tests. */
	currentVariable(): string {
		const settings = this.getSettings().backgroundImage;
		return this.enabled && settings?.enabled ? settings.variableName : '';
	}
}
