import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read plugin id from dist/manifest.json
const manifestPath = join(__dirname, '..', 'dist', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const pluginId = manifest.id;

// Local Obsidian vault plugin path
const localPluginPath = join('H:', 'Docs', 'Obsinote', '.obsidian', 'plugins', pluginId);

// Ensure target directory exists
if (!existsSync(localPluginPath)) {
    mkdirSync(localPluginPath, { recursive: true });
}

// Copy artifacts (from dist/)
const filesToCopy = ['main.js', 'manifest.json', 'styles.css'];

for (const file of filesToCopy) {
    const src = join(__dirname, '..', 'dist', file);
    const dest = join(localPluginPath, file);

    if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`\u2713 Copied ${file} to local plugins`);
    } else if (file !== 'styles.css') {
        console.warn(`\u26a0 Warning: ${file} not found in dist/`);
    }
}

// Create .hotreload file if missing (triggers Hot Reload plugin)
const hotreloadPath = join(localPluginPath, '.hotreload');
if (!existsSync(hotreloadPath)) {
    writeFileSync(hotreloadPath, '');
    console.log(`\u2713 Created .hotreload file`);
}

console.log(`\n\u2705 Build and copy completed for plugin: ${pluginId}`);
console.log(`\ud83d\udcc1 Target: ${localPluginPath}`);
