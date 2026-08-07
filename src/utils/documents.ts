import type { App } from 'obsidian';

/**
 * Returns every Obsidian document currently reachable by the plugin.
 *
 * Obsidian 1.13 can host Settings in a detached window. In that case the
 * module-global `document` remains the main window while `activeDocument`
 * points at the focused Settings window. Workspace popouts add still more
 * documents, so publishing only to `activeDocument` leaves the other windows
 * stale.
 */
export function getAppDocuments(app?: App): Document[] {
	const documents = new Set<Document>();
	const add = (candidate: Document | null | undefined): void => {
		if (candidate?.documentElement && candidate.body) documents.add(candidate);
	};

	add(globalThis.document);
	if (typeof activeDocument !== 'undefined') add(activeDocument);

	const workspace = app?.workspace;
	add(workspace?.containerEl?.ownerDocument);
	workspace?.iterateAllLeaves?.((leaf) => {
		add(leaf.view?.containerEl?.ownerDocument);
	});

	return Array.from(documents);
}
