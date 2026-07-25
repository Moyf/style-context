import { AbstractInputSuggest, App, TFolder } from 'obsidian';

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	private readonly inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
		// AbstractInputSuggest only opens on the 'input' event (user typing).
		// Synthesize one on focus so the dropdown opens immediately when the
		// user clicks or tabs into the field. Safe: the resulting onChange
		// in SettingsTab short-circuits when value is unchanged.
		inputEl.addEventListener('focus', () => {
			inputEl.dispatchEvent(new Event('input', { bubbles: true }));
		});
	}

	protected getSuggestions(query: string): TFolder[] {
		const folders = this.app.vault.getAllFolders();
		const terms = query
			.toLowerCase()
			.split(/\s+/)
			.filter((t) => t.length > 0);
		// Empty query (e.g. on focus): show first 100 folders as a starting point.
		if (terms.length === 0) return folders.slice(0, 100);
		return folders
			.filter((folder) => {
				const path = folder.path.toLowerCase();
				return terms.every((term) => path.includes(term));
			})
			.slice(0, 100);
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder): void {
		this.setValue(folder.path);
		// setValue() updates the DOM but does NOT dispatch any event, so
		// TextComponent.onChange (which listens for 'input', not 'change')
		// would never fire on selection. Dispatch 'input' manually so the
		// selected path propagates to settings.
		this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
		this.close();
	}
}
