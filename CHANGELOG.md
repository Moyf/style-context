# Changelog

All notable changes to Style Context will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - Unreleased

### ⚠️ Breaking Changes

- **Minimum Obsidian version**: Require 1.13.0 and adopt its declarative Settings API. Earlier app versions can no longer load this release.

### ⚡ Changed

- **Native settings lists**: Manage path rules and image variables with searchable declarative settings, native add/delete/reorder controls, and render callbacks for complex rows.
- **Window-local resources**: Publish resource CSS variables to the main window, popouts, and the separate Settings window so image previews resolve immediately.

<details>
<summary>中文说明（点击展开）</summary>

### ⚠️ 破坏性变更

- **最低 Obsidian 版本**：升级至 1.13.0，并采用其声明式 Settings API；更早的版本无法加载此版本插件。

### ⚡ 变更

- **原生设置列表**：路径规则和图片变量改用可搜索的声明式设置、原生添加/删除/排序控件，并为复杂行保留 render 回调。
- **窗口内资源变量**：将资源 CSS 变量发布到主窗口、弹出窗口和独立设置窗口，让图片预览立即解析。

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
