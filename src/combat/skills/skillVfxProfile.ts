import type { InsightIntentId } from '@/progression/SkillDefinition';
import { VFX_TEXTURE_KEYS } from '@/combat/art/pixelVfxDraw';

export type SkillImpactKind =
  | 'intent'
  | 'void_nova'
  | 'void_abyss'
  | 'flame_lotus'
  | 'time_echo'
  | 'time_stasis'
  | 'sword_burst'
  | 'thunder_ground';

export type SkillAoeKind = 'flame_petal' | 'flame_lotus' | 'flame_pillar';

export type SkillHealKind = 'life_bloom' | 'life_pulse' | 'life_spirit';

export interface SkillVfxProfile {
  projectileTexture?: string;
  meleeTexture?: string;
  impact: SkillImpactKind;
  aoe: SkillAoeKind;
  heal: SkillHealKind;
  meleeFlurry?: number;
  castStormBolts?: number;
}

/** Cultivation art name from skill id — e.g. tribulation, lotus, heaven. */
export function skillArtKey(skillId: string): string {
  const parts = skillId.replace(/^skill\./, '').split('.');
  const last = parts[parts.length - 1] ?? 'base';
  if (last === 'awakened' || /^v\d+$/.test(last)) {
    return parts[parts.length - 2] ?? parts[0] ?? 'base';
  }
  return last;
}

const LIGHTNING_FORK_ARTS = new Set(['fork', 'arc', 'storm']);
const VOID_NOVA_ARTS = new Set(['nova']);
const VOID_ABYSS_ARTS = new Set(['abyss']);
const TIME_STASIS_ARTS = new Set(['stasis']);
const TIME_ECHO_ARTS = new Set(['echo']);
const FLAME_LOTUS_ARTS = new Set(['lotus']);
const FLAME_PILLAR_ARTS = new Set(['pillar']);
const SWORD_HEAVEN_ARTS = new Set(['heaven']);
const SWORD_BURST_ARTS = new Set(['burst']);
const SWORD_RAIN_ARTS = new Set(['rain']);
const LIFE_SPIRIT_ARTS = new Set(['spirit']);
const LIFE_PULSE_ARTS = new Set(['pulse', 'surge']);

function defaultProjectileTexture(intent: InsightIntentId): string {
  switch (intent) {
    case 'flame':
      return VFX_TEXTURE_KEYS.flameOrb;
    case 'lightning':
      return VFX_TEXTURE_KEYS.lightningBolt;
    case 'void':
      return VFX_TEXTURE_KEYS.voidShard;
    case 'time':
      return VFX_TEXTURE_KEYS.timeVortex;
    case 'sword':
      return VFX_TEXTURE_KEYS.arrow;
    default:
      return VFX_TEXTURE_KEYS.bolt;
  }
}

function defaultMeleeTexture(intent: InsightIntentId): string {
  switch (intent) {
    case 'void':
      return VFX_TEXTURE_KEYS.voidRift;
    case 'sword':
      return VFX_TEXTURE_KEYS.swordQi;
    default:
      return VFX_TEXTURE_KEYS.slash;
  }
}

/** Per-art visual profile for v1–v5 and awakened cultivation skills. */
export function getSkillVfxProfile(skillId: string, intent: InsightIntentId): SkillVfxProfile {
  const art = skillArtKey(skillId);

  let projectileTexture = defaultProjectileTexture(intent);
  if (LIGHTNING_FORK_ARTS.has(art)) projectileTexture = VFX_TEXTURE_KEYS.lightningFork;
  if (VOID_NOVA_ARTS.has(art)) projectileTexture = VFX_TEXTURE_KEYS.voidNova;
  if (VOID_ABYSS_ARTS.has(art)) projectileTexture = VFX_TEXTURE_KEYS.voidAbyss;
  if (TIME_STASIS_ARTS.has(art)) projectileTexture = VFX_TEXTURE_KEYS.timeStasis;

  let meleeTexture = defaultMeleeTexture(intent);
  if (SWORD_HEAVEN_ARTS.has(art)) meleeTexture = VFX_TEXTURE_KEYS.swordHeaven;

  let impact: SkillImpactKind = 'intent';
  if (VOID_NOVA_ARTS.has(art)) impact = 'void_nova';
  if (VOID_ABYSS_ARTS.has(art)) impact = 'void_abyss';
  if (TIME_ECHO_ARTS.has(art)) impact = 'time_echo';
  if (TIME_STASIS_ARTS.has(art)) impact = 'time_stasis';
  if (SWORD_BURST_ARTS.has(art)) impact = 'sword_burst';

  let aoe: SkillAoeKind = 'flame_petal';
  if (FLAME_LOTUS_ARTS.has(art)) aoe = 'flame_lotus';
  if (FLAME_PILLAR_ARTS.has(art)) aoe = 'flame_pillar';

  let heal: SkillHealKind = 'life_bloom';
  if (LIFE_SPIRIT_ARTS.has(art)) heal = 'life_spirit';
  if (LIFE_PULSE_ARTS.has(art)) heal = 'life_pulse';

  return {
    projectileTexture,
    meleeTexture,
    impact,
    aoe,
    heal,
    meleeFlurry: SWORD_RAIN_ARTS.has(art) ? 3 : undefined,
    castStormBolts: art === 'storm' ? 3 : art === 'tribulation' ? 4 : undefined,
  };
}
