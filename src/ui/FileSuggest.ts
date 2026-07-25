import { AbstractInputSuggest, App, TFile } from 'obsidian';
import { isImageFile } from '../utils/media';

export class FileSuggest extends AbstractInputSuggest<TFile> {
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

	protected getSuggestions(query: string): TFile[] {
		// Only suggest image files — this module is for CSS image variables.
		const files = this.app.vault.getFiles().filter((f) => isImageFile(f));
		const terms = query
			.toLowerCase()
			.split(/\s+/)
			.filter((t) => t.length > 0);
		// Empty query (e.g. on focus): show first 100 images as a starting point.
		if (terms.length === 0) return files.slice(0, 100);
		return files
			.filter((file) => {
				const path = file.path.toLowerCase();
				return terms.every((term) => path.includes(term));
			})
			.slice(0, 100);
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFile): void {
		this.setValue(file.path);
		// setValue() updates the DOM but does NOT dispatch any event, so
		// TextComponent.onChange (which listens for 'input', not 'change')
		// would never fire on selection. Dispatch 'input' manually so the
		// selected path propagates to settings.
		this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
		this.close();
	}
}
