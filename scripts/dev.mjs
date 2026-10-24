/**
 * Development mode: build, serve, and rebuild when files in src/ or
 * scripts/ change. Refresh the browser after saving to see changes.
 *
 * Each rebuild runs in a fresh Node process so edits to the registry or
 * templates are always picked up (imported modules are cached otherwise).
 *
 * Usage: node scripts/dev.mjs [--port 5173] [--base /toolnest-ultimate/]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { serve, parseArgs } from './serve.mjs';
import { projectRoot } from './config.mjs';

const { port, base } = parseArgs(process.argv.slice(2));
const siteUrl = `http://localhost:${port}${base}`;

function rebuild(reason) {
  return new Promise((resolve) => {
    if (reason) console.log(`Change detected: ${reason}`);
    const child = spawn(process.execPath, [path.join(projectRoot, 'scripts', 'build.mjs')], {
      env: { ...process.env, SITE_URL: siteUrl },
      stdio: 'inherit'
    });
    child.on('exit', resolve);
  });
}

await rebuild();
await serve({ port, base });
console.log(`\n  ToolNest dev server: ${siteUrl}\n  Watching src/ and scripts/ — refresh the browser after saving (Ctrl+C to stop)\n`);

let timer = null;
let building = false;
let pending = null;
for (const dir of ['src', 'scripts']) {
  fs.watch(path.join(projectRoot, dir), { recursive: true }, (_event, file) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      pending = file ? `${dir}/${file}` : dir;
      if (building) return;
      while (pending) {
        const reason = pending;
        pending = null;
        building = true;
        await rebuild(reason);
        building = false;
      }
    }, 150);
  });
}
