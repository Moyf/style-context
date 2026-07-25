# Changelog

All notable changes to Style Context will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
