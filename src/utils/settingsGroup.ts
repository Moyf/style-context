import { Setting, requireApiVersion } from 'obsidian';
import * as ObsidianModule from 'obsidian';

export interface SettingsContainer {
	addSetting(cb: (setting: Setting) => void): void;
}

type SettingGroupInstance = {
	setHeading(text: string | DocumentFragment): SettingGroupInstance;
	addClass(...classes: string[]): SettingGroupInstance;
	addSetting(cb: (setting: Setting) => void): SettingGroupInstance;
};

type SettingGroupCtor = new (containerEl: HTMLElement) => SettingGroupInstance;

/**
 * Creates a settings group, using the native SettingGroup API on
 * Obsidian 1.11.0+, and falling back to a plain heading + Setting
 * on older versions. Keeps minAppVersion 1.7.2 viable.
 */
export function createSettingsGroup(
	containerEl: HTMLElement,
	heading?: string,
): SettingsContainer {
	if (requireApiVersion('1.11.0')) {
		const SettingGroupClass =
			(ObsidianModule as unknown as { SettingGroup?: SettingGroupCtor })
				.SettingGroup;

		if (SettingGroupClass) {
			const group = new SettingGroupClass(containerEl);
			if (heading) group.setHeading(heading);
			return {
				addSetting(cb) {
					group.addSetting(cb);
				},
			};
		}
	}

	// Fallback for API < 1.11.0
	if (heading) {
		const headingEl = containerEl.createDiv('setting-group-heading');
		headingEl.createEl('h3', { text: heading });
	}
	return {
		addSetting(cb) {
			const setting = new Setting(containerEl);
			cb(setting);
		},
	};
}
