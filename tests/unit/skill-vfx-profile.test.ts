import { describe, expect, it } from 'vitest';
import { getSkillVfxProfile, skillArtKey } from '@/combat/skills/skillVfxProfile';
import { VFX_TEXTURE_KEYS } from '@/combat/art/pixelVfxDraw';
import { resolveSkillEffects } from '@/combat/skills/resolveSkillEffects';
import { getSkillDefinition } from '@/progression/SkillLoader';

describe('skillArtKey', () => {
  it('extracts cultivation art names from versioned ids', () => {
    expect(skillArtKey('skill.lightning.tribulation.v5')).toBe('tribulation');
    expect(skillArtKey('skill.flame.lotus.v4')).toBe('lotus');
    expect(skillArtKey('skill.void.slash.awakened')).toBe('slash');
    expect(skillArtKey('skill.flame.bolt')).toBe('bolt');
  });
});

describe('getSkillVfxProfile', () => {
  it('maps storm and fork lightning to fork bolt texture', () => {
    const storm = getSkillVfxProfile('skill.lightning.storm.v3', 'lightning');
    expect(storm.projectileTexture).toBe(VFX_TEXTURE_KEYS.lightningFork);
    expect(storm.castStormBolts).toBe(3);
  });

  it('maps void nova and abyss to unique sprites', () => {
    expect(getSkillVfxProfile('skill.void.nova.v4', 'void').projectileTexture).toBe(
      VFX_TEXTURE_KEYS.voidNova,
    );
    expect(getSkillVfxProfile('skill.void.abyss.v5', 'void').impact).toBe('void_abyss');
  });

  it('maps flame lotus and pillar AoE kinds', () => {
    expect(getSkillVfxProfile('skill.flame.lotus.v4', 'flame').aoe).toBe('flame_lotus');
    expect(getSkillVfxProfile('skill.flame.pillar.v3', 'flame').aoe).toBe('flame_pillar');
  });

  it('maps sword rain to melee flurry', () => {
    expect(getSkillVfxProfile('skill.sword.rain.v3', 'sword').meleeFlurry).toBe(3);
    expect(getSkillVfxProfile('skill.sword.heaven.v5', 'sword').meleeTexture).toBe(
      VFX_TEXTURE_KEYS.swordHeaven,
    );
  });
});

describe('advanced lightning skill effects', () => {
  it('judgment v4 uses heavenly thunder strike', () => {
    const effects = resolveSkillEffects(getSkillDefinition('skill.lightning.judgment.v4'));
    expect(effects[0]?.type).toBe('thunder_strike');
  });

  it('tribulation v5 uses thunder chain', () => {
    const effects = resolveSkillEffects(getSkillDefinition('skill.lightning.tribulation.v5'));
    expect(effects[0]?.type).toBe('thunder_chain');
    if (effects[0]?.type === 'thunder_chain') {
      expect(effects[0].maxJumps).toBe(5);
    }
  });
});
