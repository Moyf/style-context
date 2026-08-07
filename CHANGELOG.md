# Changelog

All notable changes to Style Context will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]
### 🐛 Fixed

- **Appearance slider values**: Read the current setting value when rendering each slider so mobile Settings pages show the latest Dark appearance value after navigating away and back.
- **Frameless title bar background**: Make the top-right title bar button container transparent in non-fullscreen frameless windows.

<details>
<summary>中文说明（点击展开）</summary>

### 🐛 修复

- **外观滑块数值**：每次渲染滑块时读取当前设置值，修复移动端离开并重新进入 Dark 外观页面后仍显示旧值的问题。
- **无框窗口标题栏背景**：让非全屏无框窗口右上角的标题栏按钮容器保持透明。

</details>

---

## [0.3.4] - 2026-08-07
### 🚀 Added

- **Light/dark background images**: Optionally configure separate image values and appearance settings for `theme-light` and `theme-dark` windows, while retaining the existing global configuration as the default.
- **Mode-aware random backgrounds**: Random background selection now updates the image value for the current light or dark mode when separate backgrounds are enabled.

### ⚡ Changed

- **Background settings layout**: Keep each image value directly paired with its corresponding Appearance page.
- **Startup randomization default**: Keep `Choose a random background image on startup` disabled by default.

<details>
<summary>中文说明（点击展开）</summary>

### 🚀 新增

- **明暗模式背景图**：可分别为 `theme-light` 和 `theme-dark` 窗口设置图片值与外观，同时保留原有全局配置作为默认配置。
- **按模式随机背景**：启用明暗模式背景后，随机背景图片只更新当前明暗模式对应的图片值。

### ⚡ 变更

- **背景设置布局**：每个 Image value 都会紧跟对应的 Appearance 设置。
- **启动随机背景默认值**：默认关闭「Choose a random background image on startup」。

</details>

---

## [0.3.3] - 2026-08-07
### 🚀 Added

- **Slider reset controls**: Add localized reset buttons to image opacity and every background filter slider, restoring each control to its canonical default value.

### ⚡ Changed

- **Appearance organization**: Keep opacity and blend mode under Display, reorder filters for faster adjustment, and move size, position, and repeat into a final Layout group while hiding the unused Attachment control.
- **Status bar surface**: Preserve the theme's status bar background instead of forcing it transparent when the built-in canvas background is enabled.

### 🐛 Fixed

- **Detached Settings synchronization**: Publish theme classes, image variables, and background properties across the main window, independent Settings window, and workspace popouts so live changes affect every window.
- **First-open image previews**: Publish image variables directly to the detached Settings document during its first render, eliminating the focus timing race that left previews empty until an image was selected again.

<details>
<summary>中文说明（点击展开）</summary>

### 🚀 新增

- **滑块重置控件**：为图片不透明度和所有背景滤镜滑块添加本地化重置按钮，可将各项恢复为统一定义的默认值。

### ⚡ 变更

- **外观设置整理**：在「显示」中仅保留不透明度与混合模式，重新排列滤镜顺序，并将尺寸、位置和重复方式移至末尾的「布局」组，同时隐藏未使用的「附着方式」控件。
- **状态栏表面**：启用内置画布背景时不再强制状态栏透明，保留当前主题定义的状态栏背景。

### 🐛 修复

- **独立设置窗口同步**：在主窗口、独立设置窗口和工作区弹出窗口之间同步发布主题类、图片变量与背景属性，确保实时调整作用于所有窗口。
- **首次打开图片预览**：独立设置窗口首次渲染时直接向其文档发布图片变量，消除因窗口焦点切换时序导致的空白预览，无需重新选择图片。

</details>

---

## [0.3.2] - 2026-08-07
### 🚀 Added

- **Background image previews**: Show a compact source preview beside the Image value controls and a full Appearance preview that reflects the configured opacity, blend mode, sizing, positioning, repeat, and filters.

### ⚡ Changed

- **Efficient live updates**: Apply Appearance changes only to the background service and update only CSS custom properties whose values changed, avoiding unrelated resource, theme, and note-path work while adjusting controls.

### 🐛 Fixed

- **Official review compliance**: Move background-layer rules into the static plugin stylesheet and publish runtime background and resource values through CSS custom properties, eliminating forbidden runtime `<style>` elements and lint suppressions.
- **Image value guidance**: Explain that bare custom properties such as `--image` must be wrapped as `var(--image)`, with localized guidance to copy a ready-to-use variable from its preview.
- **Responsive Image value layout**: Keep the input and shuffle button together, place the preview and validation feedback on separate rows, and wrap long CSS image examples within narrow settings panes.

<details>
<summary>中文说明（点击展开）</summary>

### 🚀 新增

- **背景图片预览**：在「图片值」控件旁显示紧凑的源图片预览，并在「外观」页面显示完整预览，实时反映不透明度、混合模式、尺寸、位置、重复方式和滤镜设置。

### ⚡ 变更

- **高效实时更新**：调整外观控件时仅应用背景服务，并只更新值发生变化的 CSS 自定义属性，避免重复执行无关的资源变量、主题和笔记路径处理。

### 🐛 修复

- **官方审核合规性**：将背景图层规则迁移至插件静态样式表，并通过 CSS 自定义属性发布运行时背景与资源值，彻底移除审核禁止的运行时 `<style>` 元素和 lint 规则禁用指令。
- **图片值输入指引**：输入 `--image` 等裸 CSS 自定义属性时，明确提示使用 `var(--image)` 包裹，并引导用户点击预览复制可直接使用的变量值。
- **图片值响应式布局**：保持输入框与随机按钮位于同一行，将预览和校验提示分别放置在后续行，并确保窄设置面板中的长 CSS 图片示例能够正常换行。

</details>

---

## [0.3.1] - 2026-08-07
### 🚀 Added

- **Flexible background image values**: Accept complete CSS `background-image` expressions such as `var(--image)`, remote `url(...)` values, and gradients, with syntax validation and a privacy notice for remote image hosts.

### ⚡ Changed

- **Ready-to-use image references**: Store the built-in background as an `imageValue` and make random selection insert `var(--name)` so copied local image references can be pasted directly.
- **Obsidian DOM helpers**: Create dynamic style and diagnostics elements with Obsidian's `createEl` and `createDiv` helpers for API compliance.

<details>
<summary>中文说明（点击展开）</summary>

### 🚀 新增

- **灵活的背景图片值**：支持填写完整的 CSS `background-image` 表达式，例如 `var(--image)`、远程 `url(...)` 和渐变，并提供语法校验与远程图片隐私提示。

### ⚡ 变更

- **可直接使用的图片引用**：内置背景改为保存 `imageValue`，随机选择会直接填入 `var(--name)`，复制的本地图片引用可以直接粘贴使用。
- **Obsidian DOM 辅助方法**：动态样式和诊断元素改用 Obsidian 的 `createEl` 与 `createDiv`，符合官方 API 规范。

</details>

---

## [0.3.0] - 2026-08-06
### 🚀 Added

- **Built-in background image**: Apply an enabled local image variable to the Obsidian canvas with random selection, opacity, blend mode, size, position, repeat, and attachment controls.
- **Background filters**: Adjust the background image layer with CSS filters — brightness, contrast, saturation, grayscale, sepia, invert, hue rotate, and blur — from the new Appearance sub-page.

### ⚡ Changed

- **Declarative settings on Obsidian 1.13**: The settings tab now uses the declarative settings API introduced in Obsidian 1.13.0, raising the minimum required Obsidian version to 1.13.0. Background display options (opacity, blend mode, size, position, repeat, attachment) and filters are grouped together in an Appearance sub-page under Background image.

### 🐛 Fixed

- **Resource variable publishing**: Publish vault resource variables in a dedicated stylesheet so they remain available to computed-style consumers without modifying the `html` element's inline style.
- **Resource variable preview**: Read computed styles when validating image variables, keeping the settings preview working with stylesheet-published variables.

<details>
<summary>中文说明（点击展开）</summary>

### 🚀 新增

- **内置背景图片**：将已启用的本地图片变量直接应用到 Obsidian 画布，支持随机选择、不透明度、混合模式、尺寸、位置、重复方式和附着方式设置。
- **背景滤镜**：在新的「外观」子页面中使用 CSS 滤镜调整背景图片图层——亮度、对比度、饱和度、灰度、褐色、反色、色相旋转和模糊。

### ⚡ 变更

- **基于 Obsidian 1.13 的声明式设置**：设置页改用 Obsidian 1.13.0 引入的声明式设置 API，最低所需 Obsidian 版本提升至 1.13.0。背景显示选项（不透明度、混合模式、尺寸、位置、重复方式、附着方式）与滤镜一同归入「背景图片」下的「外观」子页面。

### 🐛 修复

- **资源变量发布**：将库内资源变量发布到专用样式表中，使其可被计算样式读取，同时避免修改 `html` 元素的内联样式。
- **资源变量预览**：校验图片变量时读取计算样式，确保变量改用样式表发布后设置页预览仍能正常工作。

</details>

## [0.2.1] - 2026-07-26

### 🐛 Fixed

- **Startup image variables**: Re-resolve vault image rules after the workspace layout is ready, so CSS variables remain available after restarting Obsidian.

<details>
<summary>中文说明（点击展开）</summary>

### 🐛 修复

- **启动时的图片变量**：在工作区布局就绪后重新解析库内图片规则，确保重启 Obsidian 后 CSS 变量仍会生效。

</details>

---

## [0.2.0] - 2026-07-26

### 🚀 Added

- **Localized interface**: Translate commands, notices, settings, validation, and diagnostics into English, Simplified Chinese, Traditional Chinese, and Japanese.

### ⚡ Changed

- **Minimum Obsidian version**: Require 1.8.7 to use Obsidian's supported language API.

<details>
<summary>中文说明（点击展开）</summary>

### 🚀 新增

- **界面本地化**：为命令、通知、设置、校验提示和诊断提供英文、简体中文、繁体中文与日语翻译。

### ⚡ 变更

- **最低 Obsidian 版本**：升级至 1.8.7，以使用 Obsidian 支持的语言 API。

</details>

---

## [0.1.1] - 2026-07-25

### 🐛 Fixed

- **Release validation**: Check manifest metadata, package dependencies, and stylesheet declarations before a release.
- **Build dependencies**: Use Node's built-in module list instead of the redundant `builtin-modules` package.

<details>
<summary>中文说明（点击展开）</summary>

### 🐛 修复

- **发布校验**：在发布前检查 manifest 元数据、package 依赖和样式表声明。
- **构建依赖**：改用 Node 内置模块列表，移除冗余的 `builtin-modules` 包。

</details>

---

## [0.1.0] - 2026-07-25

### 🚀 Added

- **Local image variables**: Map selected vault images to stable CSS variables for `background-image` and other CSS properties.
- **Theme context**: Publish the active theme as a CSS class for theme-scoped snippet overrides.
- **Batch note CSS classes**: Apply configured classes to notes that match folder prefixes or keywords.

<details>
<summary>中文说明（点击展开）</summary>

### 🚀 新增

- **本地图片变量**：将库内选定图片映射为稳定的 CSS 变量，可用于 `background-image` 等 CSS 属性。
- **主题上下文**：将当前主题发布为 CSS 类，便于编写仅对该主题生效的 CSS 片段覆盖。
- **笔记批量 CSS 类名**：为路径前缀或关键词匹配的笔记自动应用配置好的 CSS 类名。

</details>
