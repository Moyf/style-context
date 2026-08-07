import { normalizePath } from 'obsidian';
import type { ResourceRule } from '../types';

export interface ResourcePathUpdate {
	ruleId: string;
	variableName: string;
	previousPath: string;
	nextPath: string;
}

export interface ResourcePathRewriteResult {
	updates: ResourcePathUpdate[];
	updatedVariableNames: string[];
}

/**
 * Rewrites one stored resource path for an Obsidian rename/move event.
 * Exact matches and slash-bound descendants are updated; sibling prefixes are not.
 */
export function remapResourcePath(
	storedPath: string,
	oldPath: string,
	newPath: string,
): string | null {
	const stored = normalizePath(storedPath);
	const oldNormalized = normalizePath(oldPath);
	const newNormalized = normalizePath(newPath);
	if (stored === '' || oldNormalized === '' || newNormalized === '') return null;

	const oldPrefix = `${oldNormalized}/`;
	const nextPath = stored === oldNormalized
		? newNormalized
		: stored.startsWith(oldPrefix)
			? `${newNormalized}/${stored.slice(oldPrefix.length)}`
			: null;

	return nextPath !== null && nextPath !== stored ? nextPath : null;
}

/** Mutates matching resource rules in place so existing Settings UI references stay current. */
export function rewriteResourcePaths(
	rules: readonly ResourceRule[],
	oldPath: string,
	newPath: string,
): ResourcePathRewriteResult | null {
	const updates: ResourcePathUpdate[] = [];
	const updatedVariableNames = new Set<string>();

	for (const rule of rules) {
		const nextPath = remapResourcePath(rule.filePath, oldPath, newPath);
		if (nextPath === null) continue;

		const previousPath = normalizePath(rule.filePath);
		rule.filePath = nextPath;
		updates.push({
			ruleId: rule.id,
			variableName: rule.variableName,
			previousPath,
			nextPath,
		});
		updatedVariableNames.add(rule.variableName);
	}

	return updates.length > 0
		? { updates, updatedVariableNames: [...updatedVariableNames] }
		: null;
}
