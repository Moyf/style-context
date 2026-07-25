---
title: Style Context 插件调研与需求确认
aliases:
  - Dynamic CSS Helper 重构方案
  - 动态样式上下文插件
created_at: 2026-07-24T23:28
modified_at: 2026-07-24T23:53
tags:
  - bots
  - Obsidian
  - 插件开发
  - CSS
uid: 260724232854
type: 调研
status: 已确认
---
# Style Context 插件调研与需求确认

## 建议结论

建议将新插件暂定名为 **Style Context**（中文可称“样式上下文”）。

它的职责不是“动态生成 CSS”，而是把 CSS 原生拿不到、但样式确实需要的 Obsidian 运行时上下文，稳定地发布为 class 和 CSS 变量：当前主题的 name、当前笔记命中的路径规则，以及由仓库文件解析出的资源 URL。

这比 `Dynamic CSS Helper` 更准确：后者像一个泛用工具箱，前者明确表达“向 CSS 提供上下文”。公开发布前仍需再检查社区插件 ID 与名称是否冲突。

备选名称：

- `Style Signals`：强调向 CSS 发出状态信号，稍抽象。
- `Contextual Styles`：含义明确，但偏长。
- `CSS Bridge`：突出 JS 与 CSS 的桥接，技术感较强。
- `Vault Style Context`：若确定只服务个人库，可用这个更具体的名字。

## 已确认决策

- 定位：以 Obsinote 的个人使用为第一目标，但按可发布的社区插件标准设计设置、清理、命名和兼容性。
- 首版上下文：读取主题的 name 并发布为全局 CSS class；在设置中配置“笔记路径前缀 → CSS class name”，并只将映射的 class 添加到命中的 Markdown leaf。
- 本地图片资源：在设置中单独配置“vault 文件路径 → CSS 变量名”，以 `getResourcePath()` 解析为 CSS 可用的 URL；不与笔记路径 class 规则混用。
- 尺寸：目前没有 container 无法解决的样式，删除 `wide-enough`、连续宽度变量和任何尺寸监听。
- 名称：采用 `Style Context` 作为暂定公开名；发布前再检查插件 ID `style-context` 与名称可用性。

## 现状调研

原始构想来自 [[250212_针对主题添加不同CSS的插件|针对主题添加不同 CSS 的插件]] 与 [[250213_OB动态CSS变量辅助插件|OB 动态 CSS 变量辅助插件]]，之后已经在 CST 中拆出了可运行的原型。

| 现有能力 | 现有实现 | 判断 | 在新插件中的位置 |
| --- | --- | --- | --- |
| 针对当前主题写选择器 | `css-change` 时生成 `theme-mod-<theme>` | 真需求；主题的 name 是 CSS 不可自行得知的运行时状态 | P0：主题上下文 |
| 当前页面/分栏宽度 | 监听鼠标、窗口、叶子切换，写 `--tab-width` 并加 `wide-enough` | 已被 container 替代，且当前无反例 | 删除，不迁移 |
| 本地图片转 CSS 背景 | `vault.getResourcePath(file)` 后写入 `url(...)` | 真需求；CSS 不能把 vault 路径解析为资源 URL | P0：资源变量 |
| 按笔记位置加样式 | 设想“Reddit 摘录 → fade-english”、“人员 → simple-bases” | 真需求；由设置中的路径前缀映射为指定 CSS class name | P0：笔记路径规则 |
| 特定第三方节点补 class/插 DOM | `MutationObserver` 监视 Components 弹窗和头像 | 有用但高度依赖内部 DOM | P2：独立的 DOM 增强器，不纳入核心 |

现成 CST 脚本中，`dynamicThemeId.js` 已能以 `css-change` 监听主题并设置 `body#theme-mod-…`；`registerImageToUrl.js` 已能批量将 vault 图片注册为根 CSS 变量；`startup.js` 负责启动和清理两者。它们适合作为行为原型，而不是直接作为插件架构复用。

原因是旧 QuickAdd/CST 脚本混用了全局 `window` 状态、宽泛的 `MutationObserver` 与不总是可解绑的回调。正式插件应通过 Obsidian `Plugin` 生命周期统一注册事件和 observer，并在卸载时清理本插件加上的 class、变量和 observer。

## 关于 container：页面宽度变量是否已是伪需求？

**当前结论：这是伪需求，首版完全不处理宽度。**

你的 [[250714_CSS作用域@container|container]] 实践已经证明：给 `.cm-editor` 或 `.cm-scroller` 定义命名容器后，CSS 可以用 `@container` 在真实分栏宽度下切换规则，并用 `cqw` / `cqi` 直接参与尺寸计算。这同时解决了旧方案中 `vw` 会忽略左右分屏的问题。

| 想解决的问题 | 是否还需要 JavaScript 宽度变量 | CSS 优先方案 |
| --- | --- | --- |
| 表格、卡片、正文内部随所属分栏变宽/变窄 | 否 | 命名 `container` + `@container` + `cqw` |
| 仅按固定断点切换，例如 600px、1200px | 否 | `@container name (width >= 1200px)` |
| 使用“当前容器 80% 宽”参与 `calc()` | 否 | `80cqw` |
| 把精确像素值暴露给其他 JS、调试界面或非 CSS 消费者 | 视未来真实用例而定 | 届时再单独设计，不预埋监听 |
| 判断 `叶宽 > 当前主题的 --file-line-width + 240px`，再给祖先加 `wide-enough` | 理论上可能需要 | 当前无用例，删除，不做 P1 |

因此不再维护 `--tab-width` / `--leaf-width`，也不创建 `ResizeObserver`。现有和后续响应式 CSS 均优先使用 container；未来若出现明确反例，再以独立需求评估布尔 class，而不是恢复连续宽度变量。

## 产品边界

### 一句话定义

Style Context 是一个 CSS 上下文发布器：把主题的 name、笔记路径规则和 vault 资源，转换为可预测、可清理、可在 CSS snippet 中消费的状态。

### 不做的事

- 不内置 CSS 编辑器、CSS 预处理器或任意 CSS 注入器。
- 不加载、改写主题目录中的 `patch.css`；插件只发布状态，样式仍由用户自己的 snippet 管理。
- 不以全局 DOM 观察器扫描所有节点。
- 不默认创建头像、弹窗等第三方插件的 DOM；这类功能必须是显式开启、独立配置的增强器。
- 不监听或发布页面、leaf、tab 的宽度。
- 首版不做 frontmatter、正则或条件组合规则引擎；路径规则只支持文件夹路径前缀的直接匹配。

## 功能需求表

| 编号 | 优先级 | 需求 | 行为与 CSS 契约 | 验收标准 |
| --- | --- | --- | --- | --- |
| SC-01 | P0 | 主题上下文 | 读取当前主题的 name；在 `body` 添加唯一的 `sc-theme-<slug>` class；主题切换时先移除旧 `sc-theme-*`，再写新值；未使用社区主题时为 `sc-theme-default` | 切换主题后不残留旧 class；不占用或覆盖其他插件的 `id` |
| SC-02 | P0 | 路径规则 | 设置中配置“vault 文件夹路径前缀 → CSS class name”；将配置中原样指定的单个 class 添加到命中的 Markdown leaf，而非全局 `body` | 两个并排笔记可拥有不同 class；切换笔记、关闭 leaf 或规则失效后 class 被移除；非法 class name 在保存时提示 |
| SC-03 | P0 | 资源变量 | 设置中配置“vault 文件路径 → CSS 变量名”；通过 `app.vault.getResourcePath()` 写入 `:root` 的 `url("…")` 值 | 图片在 CSS 背景中可显示；找不到文件时给出可理解的设置页错误，不静默写坏值 |
| SC-04 | P0 | 设置与可观测性 | 独立开关和即时校验；设置页显示原始主题 name、生成的 slug、已命中的路径 → class 映射和资源解析结果 | 不打开开发者工具也能定位配置错误；关闭模块会移除它写入的状态 |
| SC-05 | P0 | 生命周期安全 | 通过插件生命周期注册 workspace、vault 与 DOM 事件；禁用/重载时完整清理主题 class、leaf class、CSS 变量和 observer | 连续重载三次后，每种监听器和 class 均只有一份；无重复通知或重复更新 |
| SC-06 | P1 | 诊断命令 | 命令面板提供“复制当前样式上下文”和“重新解析资源变量” | 输出足以直接粘贴进 issue 或 CSS 调试记录 |
| SC-07 | 后续候选 | 元数据规则 | `cssclasses` 或指定 frontmatter 字段命中规则 | 仅在出现明确样式用例后立项；与原生 `cssclasses` 共存 |
| SC-08 | 后续候选 | DOM 增强器 | 为确定的第三方节点添加 class 或小型结构；每个增强器单独启用 | 卸载后 DOM 完全还原；版本/选择器不匹配时停用并提示 |

## 建议的状态模型

```text
全局 body
  sc-theme-<theme-slug>

每个 Markdown leaf
  <设置中由路径规则映射出的 CSS class name>

:root inline CSS variables
  --sc-resource-<name>: url("app://…")
```

主题 class 使用本插件专有的 `sc-theme-` 前缀，不再使用 `body#theme-mod-…`。路径规则则使用设置中映射的 CSS class name，以便直接复用既有 snippet（如 `fade-english`、`simple-bases`）。实际开发前需在 Obsidian 当前 DOM 中验证最合适的 leaf 挂载节点；接口承诺应是 class 的语义和作用域，而不是某个未经验证的内部选择器。

## 技术设计草案

1. `ThemeContextService`：订阅主题变化，读取主题的 name，并维护一个规范化的主题 class。
2. `NotePathContextService`：根据每个 Markdown leaf 的 vault 路径，计算“路径前缀 → CSS class name”映射；只维护该 leaf 的 class，不使用全局扫描。
3. `ResourceVariableService`：加载设置中的文件路径 → CSS 变量名映射，调用 `getResourcePath`，处理删除、改名和重新解析。
4. `ContextInspector`：设置页和命令面板的诊断输出。

响应式 CSS 留在 snippet 侧。例如原本“按宽度把表格扩展到当前分栏 80%”的样式，应优先写为：

```css
.cm-editor:not(.table-cell-wrapper *) {
  container-type: inline-size;
  container-name: cm-editor;
}

@container cm-editor (width >= 1200px) {
  .wide-table-v2 .cm-embed-block.cm-table-widget {
    width: max(100%, 80cqw);
  }
}
```

不再提供 `LayoutConditionService`；“阈值取当前主题的行宽变量”这类潜在需求，需要等出现真实用例后重新评估。

## 实施顺序

1. 建立最小插件壳、设置存储和主题上下文。
2. 加入路径前缀 → CSS class name 规则，并在多分栏、切换文件、关闭 leaf 下验证作用域和清理。
3. 加入资源变量和错误提示。
4. 按可发布标准补齐设置迁移、错误信息、卸载清理与主题切换测试。
5. 仅在出现明确用例后，再评估元数据规则和第三方 DOM 增强器。

## 后续触发条件

当且仅当出现以下真实样式需求时，才扩展首版边界：

- 路径前缀不能覆盖的、稳定且可复现的笔记元数据场景；
- 无法使用 container、且明确需要布尔布局状态的样式；
- 有版本兼容和还原方案的第三方 DOM 增强场景。

## 本次调研依据

- [[250212_针对主题添加不同CSS的插件|针对主题添加不同 CSS 的插件]]：主题 class、patch.css 取舍和本地图片的最初需求。
- [[250213_OB动态CSS变量辅助插件|OB 动态 CSS 变量辅助插件]]：宽度变量、`wide-enough`、路径规则和 CST 整合记录。
- [[250714_CSS作用域@container|CSS 作用域 @container]]：命名容器、容器查询和 `cqw` 已验证可处理分栏响应式布局。
- `_global/scripts/cstModules/cssHelper/dynamicThemeId.js`、`registerImageToUrl.js`、`invocable/startup.js`：当前 CST 原型及其启动/清理分层。
