import { getLanguage } from 'obsidian';
import type { Messages } from './types';
import en from './locales/en';
import zhCN from './locales/zh-CN';
import zhTW from './locales/zh-TW';
import ja from './locales/ja';

const locales = { en, 'zh-CN': zhCN, 'zh-TW': zhTW, ja } as const;

function resolveLocale(language: string): keyof typeof locales {
	const normalized = language.toLowerCase();
	if (normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk') || normalized.startsWith('zh-hant')) {
		return 'zh-TW';
	}
	if (normalized.startsWith('zh')) return 'zh-CN';
	if (normalized.startsWith('ja')) return 'ja';
	return 'en';
}

export function getMessages(language = getLanguage()): Messages {
	return locales[resolveLocale(language)];
}

export function t(): Messages {
	return getMessages();
}
