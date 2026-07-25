import tsparser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import obsidianmd from "eslint-plugin-obsidianmd";

const pluginRules = Object.keys(obsidianmd.rules).reduce((acc, key) => {
  acc[`obsidianmd/${key}`] = "warn";
  return acc;
}, {});

export default [
  {
    files: ["src/**/*.ts", "main.ts"],
    plugins: {
      obsidianmd,
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
    },
    rules: {
      ...pluginRules,
      "obsidianmd/ui/sentence-case-locale-module": ["warn", { allowAutoFix: true }],
      "obsidianmd/ui/sentence-case": ["warn", { allowAutoFix: true }],
    },
  },
];
