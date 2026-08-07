export interface Messages {
	commands: {
		copyCurrentContext: string;
		reparseResourceVariables: string;
		copyThemeSelector: string;
	};
	notices: {
		styleContextCopied: string;
		resourceVariablesReparsed: string;
		noImageVariables: string;
		copied: (value: string) => string;
	};
	settings: {
		intro: string;
		documentation: { link: string };
		groups: {
			themeContext: string;
			notePathRules: string;
			localImageVariable: string;
			backgroundImage: string;
			backgroundDisplay: string;
			backgroundFilter: string;
			diagnostics: string;
		};
		pages: {
			backgroundAppearance: string;
			backgroundAppearanceDesc: string;
		};
		labels: {
			publishThemeClass: string;
			themeClassPrefix: string;
			publishPathClasses: string;
			publishLocalImageVariables: string;
			liveStatus: string;
			folder: string;
			keyword: string;
			publishBackgroundImage: string;
			backgroundImageValue: string;
			backgroundOpacity: string;
			backgroundBlendMode: string;
			backgroundSize: string;
			backgroundPosition: string;
			backgroundRepeat: string;
			backgroundAttachment: string;
			filterBrightness: string;
			filterContrast: string;
			filterSaturate: string;
			filterGrayscale: string;
			filterSepia: string;
			filterInvert: string;
			filterHueRotate: string;
			filterBlur: string;
		};
		descriptions: {
			publishThemeClass: string;
			publishPathClasses: string;
			publishLocalImageVariables: string;
			liveStatus: string;
			themePrefixBefore: string;
			themePrefixExample: string;
			currentThemeClass: string;
			publishBackgroundImage: string;
			backgroundImageValue: string;
			backgroundOpacity: string;
			backgroundBlendMode: string;
			backgroundSize: string;
			backgroundPosition: string;
			backgroundRepeat: string;
			backgroundAttachment: string;
		};
		placeholders: {
			themeClassPrefix: string;
			folderPrefix: string;
			keywordInPath: string;
			classNames: string;
			vaultFilePath: string;
			cssVariable: string;
			backgroundImageValue: string;
		};
		buttons: {
			addPathRule: string;
			addImageVariable: string;
			deleteRule: string;
			refresh: string;
			copySnapshot: string;
			randomBackgroundImageValue: string;
		};
		tooltips: {
			clickToCopy: (value: string) => string;
			ruleDisabled: string;
			setCssVariableName: string;
			variableNameInvalid: string;
			setVaultImagePath: string;
			imageFileNotFound: string;
			notAnImageFile: string;
			variableNotPublished: string;
		};
		validation: {
			invalidPrefix: string;
			invalidClassNames: string;
			invalidCssVariableName: string;
			invalidBackgroundImageValue: string;
			duplicateVariableName: (count: number) => string;
		};
		diagnostics: {
			currentStyleContext: string;
			localImageVariables: string;
			noEnabledResourceRules: string;
			theme: string;
			notePathClasses: string;
			noOpenMarkdownViews: string;
			headers: { variable: string; status: string; leafPath: string; appliedClass: string; rule: string };
			resolved: string;
			unresolved: string;
			rawTheme: (rawName: string, slug: string) => string;
			unsaved: string;
			filePathEmpty: string;
			fileNotFound: (path: string) => string;
		};
	};
}
