/**
 * EffectDefinitionRegistry (IP-4011) — schema + loader for the Five D's declarative content.
 *
 * Known simplification (filed as BL-0037): EffectResolver.ts's actual game logic still reads its
 * durations from hardcoded constants (DISRUPT_DENY_DURATION/DEGRADE_DURATION), not from this
 * registry -- IP-4010 was implemented before this content package existed. This registry is the
 * source of truth for effect-definition *data* (effector-to-effect capability mapping, duration
 * documentation for 09-content-review/future UI), cross-checked by this package's own tests
 * against EffectResolver's real constants so the two can never silently drift without a test
 * failing -- but EffectResolver does not (yet) load this content at runtime.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type FiveDsEffectId = 'deceive' | 'disrupt' | 'deny' | 'degrade' | 'destroy';

export interface EffectDefinition {
  effectId: FiveDsEffectId;
  durationTurns: number | 'until-cleared' | 'terminal';
  stacking: 'independent' | 'none';
  allowedEffectorTemplateIds: string[];
}

function isValidEffectDefinition(d: unknown): d is EffectDefinition {
  if (typeof d !== 'object' || d === null) return false;
  const e = d as Record<string, unknown>;
  const validIds: FiveDsEffectId[] = ['deceive', 'disrupt', 'deny', 'degrade', 'destroy'];
  return (
    validIds.includes(e.effectId as FiveDsEffectId) &&
    (typeof e.durationTurns === 'number' || e.durationTurns === 'until-cleared' || e.durationTurns === 'terminal') &&
    (e.stacking === 'independent' || e.stacking === 'none') &&
    Array.isArray(e.allowedEffectorTemplateIds)
  );
}

export class EffectDefinitionRegistry {
  private definitions = new Map<FiveDsEffectId, EffectDefinition>();

  register(definition: unknown): void {
    if (!isValidEffectDefinition(definition)) {
      throw new Error(`invalid EffectDefinition: ${JSON.stringify(definition)}`);
    }
    this.definitions.set(definition.effectId, definition);
  }

  get(effectId: FiveDsEffectId): EffectDefinition | undefined {
    return this.definitions.get(effectId);
  }

  all(): EffectDefinition[] {
    return Array.from(this.definitions.values());
  }
}

export function loadEffectDefinitions(registry: EffectDefinitionRegistry): void {
  const dir = join(__dirname, 'effects');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    registry.register(JSON.parse(readFileSync(join(dir, file), 'utf-8')));
  }
}
