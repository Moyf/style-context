# Style Context

A CSS context publisher plugin for Obsidian. It converts Obsidian runtime state (theme name, note path rules, vault resources) into predictable, cleanable CSS classes and variables that user-side CSS snippets can consume.

This plugin does **not** generate or inject CSS. It only publishes state; styling remains the responsibility of your own CSS snippets.

## Install

1. Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/style-context/`.
2. Enable "Style Context" under Settings → Community plugins.

## Features

### Theme context

Adds a unique `<prefix><slug>` class to the document `body` reflecting the current theme. The class prefix is configurable in settings (default `theme-mod-`). When no community theme is active, the slug is `default`.

For example, with the default prefix `theme-mod-` and the "Brutal Gum" theme active:

```css
body.theme-mod-brutal-gum .markdown-preview-view {
  /* theme-specific overrides */
}
```

You can change the prefix in Settings → Style Context → Theme context → Theme class prefix. The live preview shows the full CSS selector for the current theme.

### Note path rules

Maps a vault folder path prefix to a CSS class name. The class is added to the matched Markdown view's container (not the global body), so two side-by-side notes can carry different classes.

```css
.fade-english .markdown-preview-view {
  /* applied only to notes under the configured prefix */
}
```

### Local image variable

Obsidian regenerates resource URLs on every vault reload, so a raw path cannot be used directly inside `url()`. This module maps a vault image to a stable CSS variable you can reference from `background-image` and similar properties. The variable name you configure is published verbatim (no prefix is added).

```css
.hero {
  background-image: var(--my-banner);
}
```

The settings page provides a live preview tile for each valid image rule. Click a tile to copy `var(--name)` to the clipboard.

## Settings

Open Settings → Style Context to configure per-module toggles, the theme class prefix, path rules, resource rules, and view a live diagnostics panel showing the raw theme name, generated slug, applied path-class map, and resource resolution status.

## License

MIT
