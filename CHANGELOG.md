# Changelog

All notable changes to Style Context will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
