interface HasId {
	id: string;
}

/**
 * Generates a stable-enough unique id for settings rows. Uses Math.random
 * which is fine here (not security-sensitive).
 */
export function generateId(prefix: string): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Finds an item by id in an array of id-bearing objects.
 */
export function findById<T extends HasId>(arr: T[], id: string): T | undefined {
	return arr.find((item) => item.id === id);
}
