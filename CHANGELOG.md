# Changelog

All notable changes to Style Context will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 🚀 Added

- **Built-in background image**: Apply an enabled local image variable to the Obsidian canvas with random selection, opacity, blend mode, size, position, repeat, and attachment controls.

<details>
<summary>中文说明（点击展开）</summary>

### 🚀 新增

- **内置背景图片**：将已启用的本地图片变量直接应用到 Obsidian 画布，支持随机选择、不透明度、混合模式、尺寸、位置、重复方式和附着方式设置。

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
