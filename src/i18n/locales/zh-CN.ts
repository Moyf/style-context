import type { Messages } from '../types';

const zhCN: Messages = {
	commands: {
		copyCurrentContext: '复制当前上下文',
		reparseResourceVariables: '重新解析资源变量',
		copyThemeSelector: '复制主题选择器',
	},
	notices: {
		styleContextCopied: '已复制样式上下文',
		resourceVariablesReparsed: '已重新解析资源变量',
		copied: (value) => `已复制：${value}`,
	},
	settings: {
		intro: '此插件将当前主题、笔记路径规则和库内图片路径发布为 CSS 类与变量，让 CSS 片段无需 JavaScript 即可响应运行时状态。',
		documentation: { link: 'Obsidian 官方 CSS 代码片段文档' },
		groups: { themeContext: '主题上下文', notePathRules: '笔记路径规则', localImageVariable: '本地图片变量', diagnostics: '诊断' },
		labels: { publishThemeClass: '发布主题类', themeClassPrefix: '主题类前缀', publishPathClasses: '发布路径类', publishLocalImageVariables: '发布本地图片变量', liveStatus: '实时状态', folder: '文件夹', keyword: '关键词' },
		descriptions: {
			publishThemeClass: '为当前主题在 body 上添加唯一的主题类。这样可通过 CSS 片段调整特定主题，无需修改主题自身文件。',
			publishPathClasses: '为路径匹配规则的笔记添加一个或多个 CSS 类（以英文逗号分隔）。无需在每篇笔记中配置 cssclasses，即可共享样式。',
			publishLocalImageVariables: 'Obsidian 会在每次重载时重新生成资源 URL，因此原始图片路径不是稳定的 CSS 值。此模块将库内图片映射为稳定的 CSS 变量，可用于 background-image 等场景。',
			liveStatus: '显示当前主题类、路径类映射和资源解析状态。',
			themePrefixBefore: '根据当前主题名称添加 body 类，用于按主题设置样式。类名会转为小写，并将非字母数字字符替换为连字符。',
			themePrefixExample: '例如，“Brutal Gum”会变为',
			currentThemeClass: '当前主题的 mod CSS 类：',
		},
		placeholders: { themeClassPrefix: 'Theme-mod-', folderPrefix: '文件夹前缀', keywordInPath: '路径中的关键词', classNames: '类名1, 类名2', vaultFilePath: '库内文件路径', cssVariable: '--my-var' },
		buttons: { addPathRule: '添加路径规则', addImageVariable: '添加图片变量', deleteRule: '删除规则', refresh: '刷新', copySnapshot: '复制快照' },
		tooltips: {
			clickToCopy: (value) => `点击复制：${value}`,
			ruleDisabled: '规则已禁用', setCssVariableName: '请设置 CSS 变量名', variableNameInvalid: '变量名无效', setVaultImagePath: '请设置库内图片路径', imageFileNotFound: '未找到图片文件', notAnImageFile: '不是图片文件', variableNotPublished: '变量尚未发布（请检查模块开关）',
		},
		validation: { invalidPrefix: '前缀无效', invalidClassNames: '类名无效', invalidCssVariableName: 'CSS 变量名无效（必须以 -- 开头）', duplicateVariableName: (count) => `另有 ${count} 条规则使用此变量名；后面的规则会覆盖前面的规则` },
		diagnostics: {
			currentStyleContext: '当前样式上下文', localImageVariables: '本地图片变量', noEnabledResourceRules: '没有启用的资源规则', theme: '主题', notePathClasses: '笔记路径类', noOpenMarkdownViews: '没有打开的 Markdown 视图', headers: { variable: '变量', status: '状态', leafPath: '叶子路径', appliedClass: '已应用的类', rule: '规则' }, resolved: '已解析', unresolved: '未解析', rawTheme: (rawName, slug) => `（原始名称：${rawName || '无'}，slug：${slug}）`, unsaved: '（未保存）', filePathEmpty: '文件路径为空', fileNotFound: (path) => `未找到文件：${path}`,
		},
	},
};

export default zhCN;
