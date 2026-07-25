import { defineConfig } from "eslint/config";
import json from "@eslint/json";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  {
    ignores: ["tests/**", "vitest.config.mts"],
  },
  ...obsidianmd.configs.recommendedWithLocalesEn,
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
  // The upstream recommended config does not assign this rule to
  // manifest.json, so match the release metadata explicitly.
  {
    files: ["manifest.json"],
    language: "json/json",
    plugins: { json, obsidianmd },
    rules: {
      // The core rule expects a JavaScript SourceCode object; @eslint/json
      // intentionally exposes a smaller JSON-specific API.
      "no-irregular-whitespace": "off",
      "obsidianmd/validate-manifest": "error",
    },
  },
  {
    files: ["esbuild.config.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
      },
    },
  },
]);
