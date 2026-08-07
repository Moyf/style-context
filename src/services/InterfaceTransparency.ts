import type { BackgroundImageSettings } from '../types';

export const INTERFACE_TRANSPARENCY_CLASSES = {
	mobileToolbar: 'sc-style-context-mobile-toolbar-transparent',
	statusBar: 'sc-style-context-status-bar-transparent',
	ribbon: 'sc-style-context-ribbon-transparent',
	titlebar: 'sc-style-context-titlebar-transparent',
} as const;

export type InterfaceTransparencySurface =
	keyof typeof INTERFACE_TRANSPARENCY_CLASSES;

export const INTERFACE_TRANSPARENCY_SURFACES = Object.keys(
	INTERFACE_TRANSPARENCY_CLASSES,
) as readonly InterfaceTransparencySurface[];

export type InterfaceTransparency = Readonly<
	Record<InterfaceTransparencySurface, boolean>
>;

export function resolveInterfaceTransparency(
	settings: BackgroundImageSettings,
): InterfaceTransparency {
	return {
		mobileToolbar: settings.mobileToolbarTransparent !== false,
		statusBar: settings.statusBarTransparent !== false,
		ribbon: settings.ribbonTransparent !== false,
		titlebar: settings.titlebarTransparent !== false,
	};
}

export function applyInterfaceTransparency(
	targetDocument: Document,
	transparency: InterfaceTransparency,
): void {
	for (const surface of INTERFACE_TRANSPARENCY_SURFACES) {
		targetDocument.body.classList.toggle(
			INTERFACE_TRANSPARENCY_CLASSES[surface],
			transparency[surface],
		);
	}
}
