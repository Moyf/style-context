import type { Messages } from '../types';

const en: Messages = {
	commands: {
		copyCurrentContext: 'Copy current context',
		reparseResourceVariables: 'Reparse resource variables',
		copyThemeSelector: 'Copy theme selector',
	},
	notices: {
		styleContextCopied: 'Style context copied',
		resourceVariablesReparsed: 'Resource variables reparsed',
		noImageVariables: 'No enabled image variables are available',
		copied: (value) => `Copied: ${value}`,
	},
	settings: {
		intro: 'This plugin exposes the current theme, note path rules, and vault image paths as CSS classes and variables, so your CSS snippets can react to runtime state without JavaScript.',
		documentation: { link: 'Obsidian CSS snippets documentation' },
		groups: { themeContext: 'Theme context', notePathRules: 'Note path rules', localImageVariable: 'Local image variable', backgroundImage: 'Background image', backgroundDisplay: 'Display', backgroundFilter: 'Filter', diagnostics: 'Diagnostics' },
		pages: { backgroundAppearance: 'Appearance', backgroundAppearanceDesc: 'Opacity, blending, sizing, placement, and CSS filters for the image layer. Filters left at their defaults are not applied.' },
		labels: { publishThemeClass: 'Publish theme class', themeClassPrefix: 'Theme class prefix', publishPathClasses: 'Publish path classes', publishLocalImageVariables: 'Publish local image variables', liveStatus: 'Live status', folder: 'Folder', keyword: 'Keyword', publishBackgroundImage: 'Enable background image', backgroundVariable: 'Image variable', backgroundOpacity: 'Image opacity', backgroundBlendMode: 'Blend mode', backgroundSize: 'Background size', backgroundPosition: 'Background position', backgroundRepeat: 'Repeat', backgroundAttachment: 'Attachment', filterBrightness: 'Brightness', filterContrast: 'Contrast', filterSaturate: 'Saturation', filterGrayscale: 'Grayscale', filterSepia: 'Sepia', filterInvert: 'Invert', filterHueRotate: 'Hue rotate', filterBlur: 'Blur' },
		descriptions: {
			publishThemeClass: "Add a unique theme class to the body for the current theme. This lets you adjust a specific theme via CSS snippets without modifying the theme's own files.",
			publishPathClasses: 'Add one or more CSS classes (comma-separated) to notes whose path matches a rule. This lets notes share styling without configuring cssclasses on each note.',
			publishLocalImageVariables: 'Resource URLs are regenerated on every reload, so raw image paths are not stable CSS values. This module maps a vault image to a stable CSS variable for background-image and similar use cases.',
			liveStatus: 'Shows the current theme class, path-class map, and resource resolution.',
			themePrefixBefore: 'Adds a body class derived from the current theme name, for per-theme styling. The class lowercases the name and replaces non-alphanumeric characters with a hyphen.',
			themePrefixExample: 'For example, "brutal gum" becomes',
			currentThemeClass: "Current theme's mod CSS class: ",
			publishBackgroundImage: 'Render a published image variable as a fixed canvas background. The layer is pointer-free, so it does not block notes or controls.',
			backgroundVariable: 'Enter a CSS variable from the local image variables above. Use the shuffle button to choose one at random.',
			backgroundOpacity: 'Controls only the image layer opacity.',
			backgroundBlendMode: 'Controls how the image blends with the current theme.',
			backgroundSize: 'How the image fits the canvas.',
			backgroundPosition: 'Where the image is anchored.',
			backgroundRepeat: 'Whether the image is tiled.',
			backgroundAttachment: 'Whether the image moves with the document.',
		},
		placeholders: { themeClassPrefix: 'Theme-mod-', folderPrefix: 'Folder prefix', keywordInPath: 'Keyword in path', classNames: 'Class1, class2', vaultFilePath: 'Vault file path', cssVariable: '--my-var', backgroundVariable: '--image-1' },
		buttons: { addPathRule: 'Add path rule', addImageVariable: 'Add image variable', deleteRule: 'Delete rule', refresh: 'Refresh', copySnapshot: 'Copy snapshot', randomBackgroundVariable: 'Choose a random image variable' },
		tooltips: {
			clickToCopy: (value) => `Click to copy: ${value}`,
			ruleDisabled: 'Rule disabled', setCssVariableName: 'Set a CSS variable name', variableNameInvalid: 'Variable name is invalid', setVaultImagePath: 'Set a vault image path', imageFileNotFound: 'Image file not found', notAnImageFile: 'Not an image file', variableNotPublished: 'Variable not published (check module toggle)',
		},
		validation: { invalidPrefix: 'Invalid prefix', invalidClassNames: 'Invalid class names', invalidCssVariableName: 'Invalid CSS variable name (must start with --)', duplicateVariableName: (count) => `Used by ${count} other rule(s); later rules override earlier ones` },
		diagnostics: {
			currentStyleContext: 'Current style context', localImageVariables: 'Local image variables', noEnabledResourceRules: 'No enabled resource rules', theme: 'Theme', notePathClasses: 'Note path classes', noOpenMarkdownViews: 'No open Markdown views', headers: { variable: 'Variable', status: 'Status', leafPath: 'Leaf path', appliedClass: 'Applied class', rule: 'Rule' }, resolved: 'Resolved', unresolved: 'Unresolved', rawTheme: (rawName, slug) => ` (raw: ${rawName || '(none)'}, slug: ${slug})`, unsaved: '(unsaved)', filePathEmpty: 'File path is empty', fileNotFound: (path) => `File not found: ${path}`,
		},
	},
};

export default en;
