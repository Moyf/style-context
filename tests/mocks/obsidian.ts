interface DomElementOptions {
	cls?: string | string[];
}

function installDomHelpers(): void {
	Object.defineProperty(HTMLElement.prototype, 'createEl', {
		configurable: true,
		value(this: HTMLElement, tag: keyof HTMLElementTagNameMap) {
			const element = this.ownerDocument.createElement(tag);
			this.appendChild(element);
			return element;
		},
		writable: true,
	});
	Object.defineProperty(HTMLElement.prototype, 'createDiv', {
		configurable: true,
		value(this: HTMLElement, options?: DomElementOptions) {
			const element = this.ownerDocument.createElement('div');
			if (options?.cls) {
				const classes = Array.isArray(options.cls) ? options.cls : [options.cls];
				element.classList.add(...classes);
			}
			this.appendChild(element);
			return element;
		},
		writable: true,
	});
}

installDomHelpers();

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
