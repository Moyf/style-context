import { describe, expect, it } from 'vitest';
import { getMessages } from '../src/i18n/i18n';

describe('i18n', () => {
	it.each([
		['en', 'Copy current context'],
		['zh', '复制当前上下文'],
		['zh-TW', '複製目前內容'],
		['zh-HK', '複製目前內容'],
		['ja', '現在のコンテキストをコピー'],
		['ko', 'Copy current context'],
	])('selects the expected locale for %s', (language, commandName) => {
		expect(getMessages(language).commands.copyCurrentContext).toBe(commandName);
	});

	describe('pages.interfaceTransparency', () => {
		it.each([
			['en', 'Interface transparency'],
			['zh', '界面透明度'],
			['zh-TW', '介面透明度'],
			['ja', 'インターフェースの透明度'],
		])('has the correct title for locale %s', (language, expected) => {
			expect(getMessages(language).settings.pages.interfaceTransparency).toBe(expected);
		});
	});

	describe('labels.mobileToolbarTransparent', () => {
		it.each([
			['en', 'Transparent mobile toolbar'],
			['zh', '移动端工具栏透明'],
			['zh-TW', '行動端工具列透明'],
			['ja', 'モバイルツールバーを透明化'],
		])('has the correct label for locale %s', (language, expected) => {
			expect(getMessages(language).settings.labels.mobileToolbarTransparent).toBe(expected);
		});
	});

	describe('labels.statusBarTransparent', () => {
		it.each([
			['en', 'Transparent status bar'],
			['zh', '状态栏透明'],
			['zh-TW', '狀態列透明'],
			['ja', 'ステータスバーを透明化'],
		])('has the correct label for locale %s', (language, expected) => {
			expect(getMessages(language).settings.labels.statusBarTransparent).toBe(expected);
		});
	});

	describe('labels.ribbonTransparent', () => {
		it.each([
			['en', 'Transparent ribbon'],
			['zh', 'Ribbon 透明'],
			['zh-TW', 'Ribbon 透明'],
			['ja', 'Ribbon を透明化'],
		])('has the correct label for locale %s', (language, expected) => {
			expect(getMessages(language).settings.labels.ribbonTransparent).toBe(expected);
		});
	});

	describe('labels.titlebarTransparent', () => {
		it.each([
			['en', 'Transparent title bar'],
			['zh', '窗口标题栏透明'],
			['zh-TW', '視窗標題列透明'],
			['ja', 'ウィンドウタイトルバーを透明化'],
		])('has the correct label for locale %s', (language, expected) => {
			expect(getMessages(language).settings.labels.titlebarTransparent).toBe(expected);
		});
	});
});
