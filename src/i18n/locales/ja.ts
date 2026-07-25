import type { Messages } from '../types';

const ja: Messages = {
	commands: {
		copyCurrentContext: '現在のコンテキストをコピー',
		reparseResourceVariables: 'リソース変数を再解析',
		copyThemeSelector: 'テーマセレクターをコピー',
	},
	notices: {
		styleContextCopied: 'スタイルコンテキストをコピーしました',
		resourceVariablesReparsed: 'リソース変数を再解析しました',
		copied: (value) => `コピーしました: ${value}`,
	},
	settings: {
		intro: 'このプラグインは、現在のテーマ、ノートパスのルール、保管庫内の画像パスを CSS クラスと変数として公開します。CSS スニペットは JavaScript なしで実行時の状態に応答できます。',
		documentation: { link: 'Obsidian の公式 CSS スニペットドキュメント' },
		groups: { themeContext: 'テーマコンテキスト', notePathRules: 'ノートパスのルール', localImageVariable: 'ローカル画像変数', diagnostics: '診断' },
		labels: { publishThemeClass: 'テーマクラスを公開', themeClassPrefix: 'テーマクラスの接頭辞', publishPathClasses: 'パスクラスを公開', publishLocalImageVariables: 'ローカル画像変数を公開', liveStatus: 'ライブステータス', folder: 'フォルダ', keyword: 'キーワード' },
		descriptions: {
			publishThemeClass: '現在のテーマに固有のテーマクラスを body に追加します。テーマ自身のファイルを変更せず、CSS スニペットで特定テーマを調整できます。',
			publishPathClasses: 'パスがルールに一致するノートに CSS クラスを 1 つ以上追加します（カンマ区切り）。各ノートで cssclasses を設定しなくてもスタイルを共有できます。',
			publishLocalImageVariables: 'Obsidian は再読み込みごとにリソース URL を再生成するため、生の画像パスは安定した CSS 値になりません。このモジュールは保管庫内の画像を background-image などで使える安定した CSS 変数に対応付けます。',
			liveStatus: '現在のテーマクラス、パスクラスの対応、リソース解決状況を表示します。',
			themePrefixBefore: '現在のテーマ名から body クラスを追加し、テーマごとのスタイルに使用します。クラス名は小文字になり、英数字以外の文字はハイフンに置き換えられます。',
			themePrefixExample: '例: 「Brutal Gum」は次になります',
			currentThemeClass: '現在のテーマの mod CSS クラス: ',
		},
		placeholders: { themeClassPrefix: 'Theme-mod-', folderPrefix: 'フォルダの接頭辞', keywordInPath: 'パス内のキーワード', classNames: 'class1, class2', vaultFilePath: '保管庫内のファイルパス', cssVariable: '--my-var' },
		buttons: { addPathRule: 'パスのルールを追加', addImageVariable: '画像変数を追加', deleteRule: 'ルールを削除', refresh: '更新', copySnapshot: 'スナップショットをコピー' },
		emptyStates: { noPathRules: 'パスのルールはまだありません。', noImageVariables: '画像変数はまだありません。' },
		tooltips: {
			clickToCopy: (value) => `クリックしてコピー: ${value}`,
			ruleDisabled: 'ルールは無効です', setCssVariableName: 'CSS 変数名を設定してください', variableNameInvalid: '変数名が無効です', setVaultImagePath: '保管庫内の画像パスを設定してください', imageFileNotFound: '画像ファイルが見つかりません', notAnImageFile: '画像ファイルではありません', variableNotPublished: '変数が公開されていません（モジュールの切り替えを確認してください）',
		},
		validation: { invalidPrefix: '接頭辞が無効です', invalidClassNames: 'クラス名が無効です', invalidCssVariableName: 'CSS 変数名が無効です（-- で始める必要があります）', duplicateVariableName: (count) => `${count} 件の他のルールがこの変数名を使用しています。後のルールが前のルールを上書きします` },
		diagnostics: {
			currentStyleContext: '現在のスタイルコンテキスト', localImageVariables: 'ローカル画像変数', noEnabledResourceRules: '有効なリソースルールはありません', theme: 'テーマ', notePathClasses: 'ノートパスのクラス', noOpenMarkdownViews: '開いている Markdown ビューはありません', headers: { variable: '変数', status: '状態', leafPath: 'リーフのパス', appliedClass: '適用済みクラス', rule: 'ルール' }, resolved: '解決済み', unresolved: '未解決', rawTheme: (rawName, slug) => `（元の名前: ${rawName || 'なし'}、スラッグ: ${slug}）`, unsaved: '（未保存）', filePathEmpty: 'ファイルパスが空です', fileNotFound: (path) => `ファイルが見つかりません: ${path}`,
		},
	},
};

export default ja;
