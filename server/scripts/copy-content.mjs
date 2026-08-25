/**
 * Post-build content copy (IP-9038, closes BL-0027) — tsc -b doesn't copy runtime-read JSON into
 * dist/, so loadContent.ts/EffectDefinitionRegistry.ts's __dirname-relative reads find nothing
 * after a real build. Copies each content subdirectory verbatim, preserving the exact relative
 * structure those two files already expect — no code change needed, only the missing files.
 */
import { cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcContent = join(__dirname, '..', 'src', 'content');
const distContent = join(__dirname, '..', 'dist', 'content');

const subdirs = ['assetTypes', 'missionSets', 'effects'];

for (const subdir of subdirs) {
  const src = join(srcContent, subdir);
  const dest = join(distContent, subdir);
  if (!existsSync(src)) {
    throw new Error(`copy-content.mjs: expected content directory missing: ${src}`);
  }
  cpSync(src, dest, { recursive: true });
}
