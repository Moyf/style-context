import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, parse, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(scriptDirectory, "..");
const manifestPath = join(repositoryDirectory, "dist", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const discoveredEnvironment = findEnvironmentValue("VAULT_PATH", repositoryDirectory);
const configuredVaultPath = process.env.VAULT_PATH?.trim() || discoveredEnvironment?.value;

if (!configuredVaultPath) {
  throw new Error(
    "VAULT_PATH is not set. Add it to the environment or to a .env file in this repository or a parent directory.",
  );
}

const vaultPath = isAbsolute(configuredVaultPath)
  ? configuredVaultPath
  : resolve(discoveredEnvironment?.directory ?? repositoryDirectory, configuredVaultPath);
const configDirectory = join(vaultPath, ".obsidian");

if (!existsSync(vaultPath)) {
  throw new Error(`Vault directory does not exist: ${vaultPath}`);
}
if (!existsSync(configDirectory)) {
  throw new Error(`Vault directory does not contain .obsidian: ${vaultPath}`);
}

const pluginDirectory = join(configDirectory, "plugins", manifest.id);
mkdirSync(pluginDirectory, { recursive: true });

for (const filename of ["main.js", "manifest.json", "styles.css"]) {
  const source = join(repositoryDirectory, "dist", filename);
  if (!existsSync(source)) {
    if (filename !== "styles.css") {
      throw new Error(`Build output is missing: ${source}`);
    }
    continue;
  }
  copyFileSync(source, join(pluginDirectory, filename));
}

const hotReloadMarker = join(pluginDirectory, ".hotreload");
if (!existsSync(hotReloadMarker)) {
  writeFileSync(hotReloadMarker, "");
}

console.log(`Copied ${manifest.id} to ${pluginDirectory}`);

function findEnvironmentValue(key, startDirectory) {
  let directory = resolve(startDirectory);
  const root = parse(directory).root;

  while (true) {
    const environmentPath = join(directory, ".env");
    if (existsSync(environmentPath)) {
      const value = parseEnvironmentValue(readFileSync(environmentPath, "utf8"), key);
      if (value !== undefined) {
        return { directory, value };
      }
    }
    if (directory === root) {
      return null;
    }
    directory = dirname(directory);
  }
}

function parseEnvironmentValue(contents, key) {
  for (const line of contents.split(/\r?\n/u)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);
    if (!match || match[1] !== key) {
      continue;
    }

    const rawValue = match[2].trim();
    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      return rawValue.slice(1, -1);
    }
    return rawValue.replace(/\s+#.*$/u, "").trim();
  }
  return undefined;
}
