import type { ResourceRule } from '../types';
import { isValidCssVarName } from './validation';

/**
 * Picks an enabled, valid image variable. When possible, the current choice
 * is excluded so pressing the shuffle button produces a visible change.
 */
export function pickRandomImageVariable(
	rules: readonly ResourceRule[],
	currentVariable = '',
	random = Math.random,
): string | null {
	const candidates = [
		...new Set(
			rules
				.filter((rule) => rule.enabled && isValidCssVarName(rule.variableName.trim()))
				.map((rule) => rule.variableName.trim()),
		),
	];
	if (candidates.length === 0) return null;

	const pool =
		candidates.length > 1
			? candidates.filter((variableName) => variableName !== currentVariable)
			: candidates;
	const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
	return pool[index] ?? null;
}
