import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  {
    ignores: ["tests/**", "vitest.config.mts"],
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts", "main.ts"],
    languageOptions: {
      globals: {
        activeDocument: "readonly",
        navigator: "readonly",
        window: "readonly",
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "obsidianmd/ui/sentence-case": ["error", {
        allowAutoFix: true,
        enforceCamelCaseLower: true,
      }],
    },
  },
  // This tab supports Obsidian 1.7.2 and relies on dynamic multi-field rule
  // rows, so the 1.13 declarative settings API cannot replace display() yet.
  {
    files: ["src/settings/SettingsTab.ts"],
    rules: {
      "@typescript-eslint/no-deprecated": "off",
    },
  },
]);
