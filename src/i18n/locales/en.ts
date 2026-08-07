import type { Messages } from '../types';

const en: Messages = {
	commands: {
		copyCurrentContext: 'Copy current context',
		reparseResourceVariables: 'Reparse resource variables',
			copyThemeSelector: 'Copy theme selector',
			randomBackgroundImage: 'Choose a random background image',
	},
	notices: {
		styleContextCopied: 'Style context copied',
		resourceVariablesReparsed: 'Resource variables reparsed',
			noImageVariables: 'No enabled image variables are available',
			backgroundImageRandomized: 'Random background image selected',
		copied: (value) => `Copied: ${value}`,
	},
	settings: {
		intro: 'This plugin exposes the current theme, note path rules, and vault image paths as CSS classes and variables, so your CSS snippets can react to runtime state without JavaScript.',
		documentation: { link: 'Obsidian CSS snippets documentation' },
		groups: { themeContext: 'Theme context', notePathRules: 'Note path rules', localImageVariable: 'Local image variable', backgroundImage: 'Background image', backgroundDisplay: 'Display', backgroundFilter: 'Filter', backgroundLayout: 'Layout', diagnostics: 'Diagnostics' },
		pages: { backgroundAppearance: 'Appearance', backgroundAppearanceDesc: 'Opacity, blending, sizing, placement, and CSS filters for the image layer. Filters left at their defaults are not applied.', lightBackgroundAppearance: 'Light appearance', darkBackgroundAppearance: 'Dark appearance', interfaceTransparency: 'Interface transparency', interfaceTransparencyDesc: 'Controls for blending the interface into the background layer.', backgroundRandomization: 'Randomize image background', backgroundRandomizationDesc: 'Choose when and where to randomize the background image.' },
		labels: { publishThemeClass: 'Publish theme class', themeClassPrefix: 'Theme class prefix', publishPathClasses: 'Publish path classes', publishLocalImageVariables: 'Publish local image variables', liveStatus: 'Live status', folder: 'Folder', keyword: 'Keyword', publishBackgroundImage: 'Enable background image', perModeBackground: 'Separate light and dark backgrounds', randomBackgroundOnStartup: 'Choose a random background image on startup', addRandomBackgroundRibbon: 'Add ribbon icon', backgroundImageValue: 'Image value', lightBackgroundImageValue: 'Light image value', darkBackgroundImageValue: 'Dark image value', backgroundOpacity: 'Image opacity', backgroundBlendMode: 'Blend mode', backgroundSize: 'Background size', backgroundPosition: 'Background position', backgroundRepeat: 'Repeat', backgroundAttachment: 'Attachment', filterBrightness: 'Brightness', filterContrast: 'Contrast', filterSaturate: 'Saturation', filterGrayscale: 'Grayscale', filterSepia: 'Sepia', filterInvert: 'Invert', filterHueRotate: 'Hue rotate', filterBlur: 'Blur', mobileToolbarTransparent: 'Transparent mobile toolbar', statusBarTransparent: 'Transparent status bar', ribbonTransparent: 'Transparent ribbon', titlebarTransparent: 'Transparent title bar' },
		descriptions: {
			publishThemeClass: "Add a unique theme class to the body for the current theme. This lets you adjust a specific theme via CSS snippets without modifying the theme's own files.",
			publishPathClasses: 'Add one or more CSS classes (comma-separated) to notes whose path matches a rule. This lets notes share styling without configuring cssclasses on each note.',
			publishLocalImageVariables: 'Resource URLs are regenerated on every reload, so raw image paths are not stable CSS values. This module maps a vault image to a stable CSS variable for background-image and similar use cases.',
			liveStatus: 'Shows the current theme class, path-class map, and resource resolution.',
			themePrefixBefore: 'Adds a body class derived from the current theme name, for per-theme styling. The class lowercases the name and replaces non-alphanumeric characters with a hyphen.',
			themePrefixExample: 'For example, "brutal gum" becomes',
			currentThemeClass: "Current theme's mod CSS class: ",
				publishBackgroundImage: 'Render a CSS image value as a fixed canvas background. The layer is pointer-free, so it does not block notes or controls.',
			perModeBackground: 'Use a different image value and appearance for light and dark modes. Each window follows the theme-light or theme-dark class on its body.',
				randomBackgroundOnStartup: 'Choose one eligible image variable each time Obsidian starts.',
			addRandomBackgroundRibbon: 'Show the random background image command in the ribbon.',
			mobileToolbarTransparent: 'Make the mobile toolbar background transparent so the canvas background shows through.',
			statusBarTransparent: 'Make the status bar background transparent so the canvas background shows through.',
			ribbonTransparent: 'Make the ribbon background transparent so the canvas background shows through.',
			titlebarTransparent: 'Make the window title bar background transparent so the canvas background shows through.',
			backgroundImageValue: 'Enter a full CSS image value, such as var(--image-1) or url("https://example.com/image.jpg"). Remote URLs contact the image host. The shuffle button chooses a local image variable.',
			backgroundOpacity: 'Controls only the image layer opacity.',
			backgroundBlendMode: 'Controls how the image blends with the current theme.',
			backgroundSize: 'How the image fits the canvas.',
			backgroundPosition: 'Where the image is anchored.',
			backgroundRepeat: 'Whether the image is tiled.',
			backgroundAttachment: 'Whether the image moves with the document.',
		},
		// eslint-disable-next-line obsidianmd/ui/sentence-case-locale-module -- CSS syntax is case-sensitive.
		placeholders: { themeClassPrefix: 'Theme-mod-', folderPrefix: 'Folder prefix', keywordInPath: 'Keyword in path', classNames: 'Class1, class2', vaultFilePath: 'Vault file path', cssVariable: '--my-var', backgroundImageValue: 'var(--image-1)' },
		buttons: { addPathRule: 'Add path rule', addImageVariable: 'Add image variable', deleteRule: 'Delete rule', refresh: 'Refresh', copySnapshot: 'Copy snapshot', randomBackgroundImageValue: 'Choose a random image variable', reset: 'Reset to default' },
		tooltips: {
			clickToCopy: (value) => `Click to copy: ${value}`,
			resourceVariableEnabled: 'Enable or disable publishing this image variable', ruleDisabled: 'Rule disabled', useForBackgroundImage: 'Whether to use this image for random background selection', backgroundImageExcluded: 'Excluded from random background selection', setCssVariableName: 'Set a CSS variable name', variableNameInvalid: 'Variable name is invalid', setVaultImagePath: 'Set a vault image path', imageFileNotFound: 'Image file not found', notAnImageFile: 'Not an image file', variableNotPublished: 'Variable not published (check module toggle)',
		},
		validation: { invalidPrefix: 'Invalid prefix', invalidClassNames: 'Invalid class names', invalidCssVariableName: 'Invalid CSS variable name (must start with --)', invalidBackgroundImageValue: 'Invalid CSS background-image value', backgroundImageVariableRequiresVar: 'Wrap the CSS variable in var(), for example var(--image). You can click an image variable preview above to copy it.', duplicateVariableName: (count) => `Used by ${count} other rule(s); later rules override earlier ones` },
		diagnostics: {
			currentStyleContext: 'Current style context', localImageVariables: 'Local image variables', noEnabledResourceRules: 'No enabled resource rules', theme: 'Theme', notePathClasses: 'Note path classes', noOpenMarkdownViews: 'No open Markdown views', headers: { variable: 'Variable', status: 'Status', leafPath: 'Leaf path', appliedClass: 'Applied class', rule: 'Rule' }, resolved: 'Resolved', unresolved: 'Unresolved', rawTheme: (rawName, slug) => ` (raw: ${rawName || '(none)'}, slug: ${slug})`, unsaved: '(unsaved)', filePathEmpty: 'File path is empty', fileNotFound: (path) => `File not found: ${path}`,
		},
	},
};

export default en;
