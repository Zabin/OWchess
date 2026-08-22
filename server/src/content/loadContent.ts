/**
 * Content-registration hook (IP-3011) — loads the v1 asset-type and mission-set JSON templates
 * into a TemplateRegistry. The one place this package is allowed to touch engine code, per its
 * own Files to Create list ("a data-registration hook... only if the package explicitly names
 * it").
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TemplateRegistry } from '../engine/TemplateRegistry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readJsonFiles(dir: string): unknown[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')));
}

export function loadContent(registry: TemplateRegistry): void {
  for (const t of readJsonFiles(join(__dirname, 'assetTypes'))) {
    registry.registerAssetTemplate(t);
  }
  for (const t of readJsonFiles(join(__dirname, 'missionSets'))) {
    registry.registerMissionSetTemplate(t);
  }
}
