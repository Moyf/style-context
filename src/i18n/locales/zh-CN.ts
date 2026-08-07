import type { Messages } from '../types';

const zhCN: Messages = {
	commands: {
		copyCurrentContext: '复制当前上下文',
		reparseResourceVariables: '重新解析资源变量',
			copyThemeSelector: '复制主题选择器',
			randomBackgroundImage: '随机选择背景图片',
	},
	notices: {
		styleContextCopied: '已复制样式上下文',
		resourceVariablesReparsed: '已重新解析资源变量',
			noImageVariables: '没有可用的已启用图片变量',
			backgroundImageRandomized: '已随机选择背景图片',
		copied: (value) => `已复制：${value}`,
	},
	settings: {
		intro: '此插件将当前主题、笔记路径规则和库内图片路径发布为 CSS 类与变量，让 CSS 片段无需 JavaScript 即可响应运行时状态。',
		documentation: { link: 'Obsidian 官方 CSS 代码片段文档' },
		groups: { themeContext: '主题上下文', notePathRules: '笔记路径规则', localImageVariable: '本地图片变量', backgroundImage: '背景图片', backgroundDisplay: '显示', backgroundFilter: '滤镜', backgroundLayout: '布局', diagnostics: '诊断' },
		pages: { backgroundAppearance: '外观', backgroundAppearanceDesc: '背景图片图层的不透明度、混合、尺寸、位置与 CSS 滤镜。滤镜保持默认值即不生效。', interfaceTransparency: '界面透明度', interfaceTransparencyDesc: '将界面融入背景图层的透明度控制。', backgroundRandomization: '随机化图像背景', backgroundRandomizationDesc: '设置随机背景图片的执行时机和入口。' },
			labels: { publishThemeClass: '发布主题类', themeClassPrefix: '主题类前缀', publishPathClasses: '发布路径类', publishLocalImageVariables: '发布本地图片变量', liveStatus: '实时状态', folder: '文件夹', keyword: '关键词', publishBackgroundImage: '启用背景图片', randomBackgroundOnStartup: '每次启动时自动随机背景', addRandomBackgroundRibbon: '添加 Ribbon 图标', backgroundImageValue: '图片值', backgroundOpacity: '图片不透明度', backgroundBlendMode: '混合模式', backgroundSize: '背景尺寸', backgroundPosition: '背景位置', backgroundRepeat: '重复方式', backgroundAttachment: '附着方式', filterBrightness: '亮度', filterContrast: '对比度', filterSaturate: '饱和度', filterGrayscale: '灰度', filterSepia: '褐色', filterInvert: '反色', filterHueRotate: '色相旋转', filterBlur: '模糊' },
		descriptions: {
			publishThemeClass: '为当前主题在 body 上添加唯一的主题类。这样可通过 CSS 片段调整特定主题，无需修改主题自身文件。',
			publishPathClasses: '为路径匹配规则的笔记添加一个或多个 CSS 类（以英文逗号分隔）。无需在每篇笔记中配置 cssclasses，即可共享样式。',
			publishLocalImageVariables: 'Obsidian 会在每次重载时重新生成资源 URL，因此原始图片路径不是稳定的 CSS 值。此模块将库内图片映射为稳定的 CSS 变量，可用于 background-image 等场景。',
			liveStatus: '显示当前主题类、路径类映射和资源解析状态。',
			themePrefixBefore: '根据当前主题名称添加 body 类，用于按主题设置样式。类名会转为小写，并将非字母数字字符替换为连字符。',
			themePrefixExample: '例如，“Brutal Gum”会变为',
			currentThemeClass: '当前主题的 mod CSS 类：',
			publishBackgroundImage: '将 CSS 图片值渲染为固定画布背景。背景层不会拦截鼠标，因此不会影响笔记和控件。',
			randomBackgroundOnStartup: '每次打开 Obsidian 时，从符合条件的图片变量中随机选择一张背景图片。',
			addRandomBackgroundRibbon: '开启后，将随机选择背景图片命令添加到 Ribbon。',
				randomBackgroundOnStartup: '每次打开 Obsidian 时，从符合条件的图片变量中随机选择一张背景图片。',
				addRandomBackgroundRibbon: '开启后，将随机选择背景图片命令添加到 Ribbon。',
			backgroundImageValue: '填写完整的 CSS 图片值，例如 var(--image-1) 或 url("https://example.com/image.jpg")。远程 URL 会连接图片所在网站；随机按钮会选择一个本地图片变量。',
			backgroundOpacity: '只调整背景图片图层的不透明度。',
			backgroundBlendMode: '控制图片与当前主题的混合方式。',
			backgroundSize: '图片如何适配画布。',
			backgroundPosition: '图片的锚点位置。',
			backgroundRepeat: '是否平铺图片。',
			backgroundAttachment: '图片是否随文档滚动。',
		},
		placeholders: { themeClassPrefix: 'Theme-mod-', folderPrefix: '文件夹前缀', keywordInPath: '路径中的关键词', classNames: '类名1, 类名2', vaultFilePath: '库内文件路径', cssVariable: '--my-var', backgroundImageValue: 'var(--image-1)' },
		buttons: { addPathRule: '添加路径规则', addImageVariable: '添加图片变量', deleteRule: '删除规则', refresh: '刷新', copySnapshot: '复制快照', randomBackgroundImageValue: '随机选择图片变量', reset: '恢复默认值' },
		tooltips: {
			clickToCopy: (value) => `点击复制：${value}`,
				ruleDisabled: '规则已禁用', useForBackgroundImage: '是否用于背景图片：启用后可被随机背景图片选中', backgroundImageExcluded: '未纳入随机背景图片选择', setCssVariableName: '请设置 CSS 变量名', variableNameInvalid: '变量名无效', setVaultImagePath: '请设置库内图片路径', imageFileNotFound: '未找到图片文件', notAnImageFile: '不是图片文件', variableNotPublished: '变量尚未发布（请检查模块开关）',
		},
		validation: { invalidPrefix: '前缀无效', invalidClassNames: '类名无效', invalidCssVariableName: 'CSS 变量名无效（必须以 -- 开头）', invalidBackgroundImageValue: 'CSS background-image 值无效', backgroundImageVariableRequiresVar: '请用 var() 包裹 CSS 变量，例如 var(--image)。也可以点击上方图片变量的预览图快速复制。', duplicateVariableName: (count) => `另有 ${count} 条规则使用此变量名；后面的规则会覆盖前面的规则` },
		diagnostics: {
			currentStyleContext: '当前样式上下文', localImageVariables: '本地图片变量', noEnabledResourceRules: '没有启用的资源规则', theme: '主题', notePathClasses: '笔记路径类', noOpenMarkdownViews: '没有打开的 Markdown 视图', headers: { variable: '变量', status: '状态', leafPath: '叶子路径', appliedClass: '已应用的类', rule: '规则' }, resolved: '已解析', unresolved: '未解析', rawTheme: (rawName, slug) => `（原始名称：${rawName || '无'}，slug：${slug}）`, unsaved: '（未保存）', filePathEmpty: '文件路径为空', fileNotFound: (path) => `未找到文件：${path}`,
		},
	},
};

export default zhCN;
