export class TFile {
	path: string;
	extension: string;

	constructor(path: string) {
		this.path = path;
		this.extension = path.split('.').pop() ?? '';
	}
}

export class MarkdownView {
	file: TFile | null;
	containerEl: HTMLElement;

	constructor(file: TFile | null, containerEl = document.body.cloneNode(false) as HTMLElement) {
		this.file = file;
		this.containerEl = containerEl;
	}
}

export function normalizePath(path: string): string {
	return path
		.replace(/\\/g, '/')
		.replace(/\/+/g, '/')
		.replace(/^\/|\/$/g, '');
}

export function getLanguage(): string {
	return 'en';
}
