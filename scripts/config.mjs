import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Build configuration. SITE_URL must be the public address of the site,
 * including the repository sub-path on GitHub Pages, for example
 * https://your-name.github.io/toolnest-ultimate/
 */
export function resolveConfig(overrides = {}) {
  let siteUrl = overrides.siteUrl || process.env.SITE_URL || 'http://localhost:5173/';
  if (!siteUrl.endsWith('/')) siteUrl += '/';
  siteUrl = siteUrl.replace(/([^:/])\/{2,}/g, '$1/');
  const url = new URL(siteUrl);
  return {
    siteUrl: url.href,
    basePath: url.pathname,
    repoUrl: (overrides.repoUrl ?? process.env.REPO_URL ?? '').replace(/\/$/, ''),
    srcDir: path.join(projectRoot, 'src'),
    outDir: overrides.outDir || path.join(projectRoot, 'dist')
  };
}
