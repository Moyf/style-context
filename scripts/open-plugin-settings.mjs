import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(scriptDirectory, "..");
const manifest = JSON.parse(readFileSync(join(repositoryDirectory, "manifest.json"), "utf8"));

// Hot Reload needs a moment to notice the copied files and finish
// reloading the plugin before the settings tab can show fresh code. The
// settle wait runs before every attempt, doubling as the retry delay.
const reloadSettleMs = Number(process.env.RELOAD_SETTLE_MS ?? 2000);
const attempts = 3;
const evalTimeoutMs = 20000;

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function openPluginSettings() {
  // The eval code opens Settings, then points it at this plugin's tab once
  // the Settings surface is ready. 'ok' is the success marker.
  const evalCode = `app.setting.open(); setTimeout(() => app.setting.openTabById('${manifest.id}'), 500); 'ok'`;
  const { stdout } = await execFileAsync(
    "obsidian.com",
    ["eval", `code=${evalCode}`],
    { timeout: evalTimeoutMs },
  );
  if (!stdout.includes("ok")) {
    throw new Error(`Unexpected Obsidian CLI output: ${stdout.trim()}`);
  }
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  await sleep(reloadSettleMs);
  try {
    await openPluginSettings();
    console.log(`Opened ${manifest.id} settings in Obsidian (attempt ${attempt})`);
    process.exit(0);
  } catch (error) {
    const reason = error?.killed
      ? `timed out after ${evalTimeoutMs}ms`
      : error?.message ?? String(error);
    console.warn(`Attempt ${attempt}/${attempts} failed: ${reason}`);
    if (attempt === attempts) {
      console.error(
        "Could not open the plugin settings. Is Obsidian running with the Obsidian CLI available on PATH?",
      );
      process.exit(1);
    }
  }
}
