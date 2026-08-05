import type { Messages } from '../types';

const zhTW: Messages = {
	commands: {
		copyCurrentContext: '複製目前內容',
		reparseResourceVariables: '重新解析資源變數',
		copyThemeSelector: '複製主題選擇器',
	},
	notices: {
		styleContextCopied: '已複製樣式內容',
		resourceVariablesReparsed: '已重新解析資源變數',
		noImageVariables: '沒有可用的已啟用圖片變數',
		copied: (value) => `已複製：${value}`,
	},
	settings: {
		intro: '此插件會將目前主題、筆記路徑規則與庫內圖片路徑發布為 CSS 類別和變數，讓 CSS 片段無需 JavaScript 即可回應執行階段狀態。',
		documentation: { link: 'Obsidian 官方 CSS 程式碼片段文件' },
		groups: { themeContext: '主題內容', notePathRules: '筆記路徑規則', localImageVariable: '本機圖片變數', backgroundImage: '背景圖片', diagnostics: '診斷' },
		labels: { publishThemeClass: '發布主題類別', themeClassPrefix: '主題類別前綴', publishPathClasses: '發布路徑類別', publishLocalImageVariables: '發布本機圖片變數', liveStatus: '即時狀態', folder: '資料夾', keyword: '關鍵字', publishBackgroundImage: '啟用背景圖片', backgroundVariable: '圖片變數', backgroundOpacity: '圖片不透明度', backgroundBlendMode: '混合模式', backgroundSize: '背景尺寸', backgroundPosition: '背景位置', backgroundRepeat: '重複方式', backgroundAttachment: '附著方式' },
		descriptions: {
			publishThemeClass: '為目前主題在 body 上新增唯一的主題類別。如此可透過 CSS 片段調整特定主題，而無需修改主題本身的檔案。',
			publishPathClasses: '為路徑符合規則的筆記新增一個或多個 CSS 類別（以半形逗號分隔）。無需在每篇筆記設定 cssclasses，也能共用樣式。',
			publishLocalImageVariables: 'Obsidian 每次重新載入時都會重新產生資源 URL，因此原始圖片路徑不是穩定的 CSS 值。此模組會將庫內圖片對應至穩定的 CSS 變數，可用於 background-image 等情境。',
			liveStatus: '顯示目前主題類別、路徑類別對應與資源解析狀態。',
			themePrefixBefore: '根據目前主題名稱新增 body 類別，用於依主題設定樣式。類別名稱會轉為小寫，並將非英數字元替換為連字號。',
			themePrefixExample: '例如，「Brutal Gum」會變為',
			currentThemeClass: '目前主題的 mod CSS 類別：',
			publishBackgroundImage: '將已發布的圖片變數渲染為固定畫布背景。背景層不會攔截滑鼠，因此不會影響筆記和控制項。',
			backgroundVariable: '填寫上方本機圖片變數中的 CSS 變數名稱，也可以按隨機按鈕選擇。',
			backgroundOpacity: '只調整背景圖片圖層的不透明度。',
			backgroundBlendMode: '控制圖片與目前主題的混合方式。',
			backgroundSize: '圖片如何適配畫布。',
			backgroundPosition: '圖片的錨點位置。',
			backgroundRepeat: '是否平鋪圖片。',
			backgroundAttachment: '圖片是否隨文件捲動。',
		},
		placeholders: { themeClassPrefix: 'Theme-mod-', folderPrefix: '資料夾前綴', keywordInPath: '路徑中的關鍵字', classNames: '類別1, 類別2', vaultFilePath: '庫內檔案路徑', cssVariable: '--my-var', backgroundVariable: '--image-1' },
		buttons: { addPathRule: '新增路徑規則', addImageVariable: '新增圖片變數', deleteRule: '刪除規則', refresh: '重新整理', copySnapshot: '複製快照', randomBackgroundVariable: '隨機選擇圖片變數' },
		tooltips: {
			clickToCopy: (value) => `按一下即可複製：${value}`,
			ruleDisabled: '規則已停用', setCssVariableName: '請設定 CSS 變數名稱', variableNameInvalid: '變數名稱無效', setVaultImagePath: '請設定庫內圖片路徑', imageFileNotFound: '找不到圖片檔案', notAnImageFile: '不是圖片檔案', variableNotPublished: '變數尚未發布（請檢查模組開關）',
		},
		validation: { invalidPrefix: '前綴無效', invalidClassNames: '類別名稱無效', invalidCssVariableName: 'CSS 變數名稱無效（必須以 -- 開頭）', duplicateVariableName: (count) => `另有 ${count} 條規則使用此變數名稱；後面的規則會覆寫前面的規則` },
		diagnostics: {
			currentStyleContext: '目前樣式內容', localImageVariables: '本機圖片變數', noEnabledResourceRules: '沒有啟用的資源規則', theme: '主題', notePathClasses: '筆記路徑類別', noOpenMarkdownViews: '沒有開啟的 Markdown 檢視', headers: { variable: '變數', status: '狀態', leafPath: '分頁路徑', appliedClass: '已套用的類別', rule: '規則' }, resolved: '已解析', unresolved: '未解析', rawTheme: (rawName, slug) => `（原始名稱：${rawName || '無'}，slug：${slug}）`, unsaved: '（未儲存）', filePathEmpty: '檔案路徑為空', fileNotFound: (path) => `找不到檔案：${path}`,
		},
	},
};

export default zhTW;
