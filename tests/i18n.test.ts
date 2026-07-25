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
});
