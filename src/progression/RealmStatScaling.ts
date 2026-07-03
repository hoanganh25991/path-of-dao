import realmsJson from '../../content/progression/realms.json';
import { realmsFileSchema, type RealmDefinition, type RealmStatMultiplier } from '@/shared/schemas/realms';
import type { BaseStats } from '@/progression/types';

const realmsData = realmsFileSchema.parse(realmsJson);
const REALM_ORDER: RealmDefinition[] = [...realmsData.realms].sort((a, b) => a.order - b.order);

const REALM_BY_ID = new Map(REALM_ORDER.map((r) => [r.id, r]));

export function listRealmDefinitions(): readonly RealmDefinition[] {
  return REALM_ORDER;
}

export function getRealmDefinition(realmId: string): RealmDefinition {
  const def = REALM_BY_ID.get(realmId);
  if (!def) {
    throw new Error(`getRealmDefinition: unknown realm "${realmId}"`);
  }
  return def;
}

export function getRealmOrder(realmId: string): number {
  return getRealmDefinition(realmId).order;
}

function multiplyStats(base: BaseStats, mult: RealmStatMultiplier): BaseStats {
  return {
    level: base.level,
    hpMax: Math.floor(base.hpMax * mult.hpMax),
    manaMax: Math.floor(base.manaMax * mult.manaMax),
    atk: Math.floor(base.atk * mult.atk),
    def: Math.floor(base.def * mult.def),
    crit: Math.min(0.75, base.crit * mult.crit),
    critDmg: Math.min(3, Math.max(1.2, base.critDmg * mult.critDmg)),
    speed: Math.min(200, Math.max(50, Math.floor(base.speed * mult.speed))),
    spirit: Math.floor(base.spirit * mult.spirit),
  };
}

/** Cumulative realm multipliers from first realm through `realmId` (inclusive). */
export function applyRealmScaling(base: BaseStats, realmId: string): BaseStats {
  let stats = { ...base };

  for (const def of REALM_ORDER) {
    stats = multiplyStats(stats, def.statMultiplier);
    if (def.id === realmId) break;
  }

  return stats;
}
