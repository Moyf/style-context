export interface Messages {
	commands: {
		copyCurrentContext: string;
		reparseResourceVariables: string;
		copyThemeSelector: string;
	};
	notices: {
		styleContextCopied: string;
		resourceVariablesReparsed: string;
		copied: (value: string) => string;
	};
	settings: {
		intro: string;
		documentation: { link: string };
		groups: {
			themeContext: string;
			notePathRules: string;
			localImageVariable: string;
			diagnostics: string;
		};
		labels: {
			publishThemeClass: string;
			themeClassPrefix: string;
			publishPathClasses: string;
			publishLocalImageVariables: string;
			liveStatus: string;
			folder: string;
			keyword: string;
		};
		descriptions: {
			publishThemeClass: string;
			publishPathClasses: string;
			publishLocalImageVariables: string;
			liveStatus: string;
			themePrefixBefore: string;
			themePrefixExample: string;
			currentThemeClass: string;
		};
		placeholders: {
			themeClassPrefix: string;
			folderPrefix: string;
			keywordInPath: string;
			classNames: string;
			vaultFilePath: string;
			cssVariable: string;
		};
		buttons: {
			addPathRule: string;
			addImageVariable: string;
			deleteRule: string;
			refresh: string;
			copySnapshot: string;
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
