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
		copied: (value) => `Copied: ${value}`,
	},
	settings: {
		intro: 'This plugin exposes the current theme, note path rules, and vault image paths as CSS classes and variables, so your CSS snippets can react to runtime state without JavaScript.',
		documentation: { link: 'Obsidian CSS snippets documentation' },
		groups: { themeContext: 'Theme context', notePathRules: 'Note path rules', localImageVariable: 'Local image variable', diagnostics: 'Diagnostics' },
		labels: { publishThemeClass: 'Publish theme class', themeClassPrefix: 'Theme class prefix', publishPathClasses: 'Publish path classes', publishLocalImageVariables: 'Publish local image variables', liveStatus: 'Live status', folder: 'Folder', keyword: 'Keyword' },
		descriptions: {
			publishThemeClass: "Add a unique theme class to the body for the current theme. This lets you adjust a specific theme via CSS snippets without modifying the theme's own files.",
			publishPathClasses: 'Add one or more CSS classes (comma-separated) to notes whose path matches a rule. This lets notes share styling without configuring cssclasses on each note.',
			publishLocalImageVariables: 'Resource URLs are regenerated on every reload, so raw image paths are not stable CSS values. This module maps a vault image to a stable CSS variable for background-image and similar use cases.',
			liveStatus: 'Shows the current theme class, path-class map, and resource resolution.',
			themePrefixBefore: 'Adds a body class derived from the current theme name, for per-theme styling. The class lowercases the name and replaces non-alphanumeric characters with a hyphen.',
			themePrefixExample: 'For example, "brutal gum" becomes',
			currentThemeClass: "Current theme's mod CSS class: ",
		},
		placeholders: { themeClassPrefix: 'Theme-mod-', folderPrefix: 'Folder prefix', keywordInPath: 'Keyword in path', classNames: 'Class1, class2', vaultFilePath: 'Vault file path', cssVariable: '--my-var' },
		buttons: { addPathRule: 'Add path rule', addImageVariable: 'Add image variable', deleteRule: 'Delete rule', refresh: 'Refresh', copySnapshot: 'Copy snapshot' },
		emptyStates: { noPathRules: 'No path rules yet.', noImageVariables: 'No image variables yet.' },
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
