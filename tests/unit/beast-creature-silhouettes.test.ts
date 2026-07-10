import { describe, expect, it } from 'vitest';
import {
  BEAST_SPRITE_CREATURE_SHAPE,
  BEAST_SPRITE_STICK_VARIANT,
} from '@/combat/art/stickyManAssets';
import { creatureShapeForVariant } from '@/combat/art/stickyManDraw';
import { getCultivatorConfig, listCultivatorIds } from '@/combat/cultivators/CultivatorLoader';

describe('beast creature silhouettes', () => {
  it('maps every registered beast sprite key to a non-human creature shape', () => {
    expect(Object.keys(BEAST_SPRITE_CREATURE_SHAPE).length).toBeGreaterThanOrEqual(14);
    for (const [spriteKey, shape] of Object.entries(BEAST_SPRITE_CREATURE_SHAPE)) {
      const variant = BEAST_SPRITE_STICK_VARIANT[spriteKey];
      expect(variant, spriteKey).toBeDefined();
      expect(creatureShapeForVariant(variant!)).toBe(shape);
    }
  });

  it('routes slime/beast/ghost/arachnid/avian/drake off the humanoid sticky-man path', () => {
    expect(creatureShapeForVariant('slime')).toBe('blob');
    expect(creatureShapeForVariant('beast')).toBe('quadruped');
    expect(creatureShapeForVariant('ghost')).toBe('spectral');
    expect(creatureShapeForVariant('arachnid')).toBe('arachnid');
    expect(creatureShapeForVariant('avian')).toBe('avian');
    expect(creatureShapeForVariant('drake')).toBe('drake');
    expect(creatureShapeForVariant('monk')).toBeNull();
    expect(creatureShapeForVariant('warrior')).toBeNull();
    expect(creatureShapeForVariant('hero')).toBeNull();
  });

  it('beast content spriteKeys that have creature sheets are in the shape table', () => {
    for (const id of listCultivatorIds()) {
      const cfg = getCultivatorConfig(id);
      if (cfg.opponentKind !== 'beast') continue;
      // Stone/totem beasts may stay humanoid; skip keys without a creature sheet.
      if (
        cfg.spriteKey === 'enemy_totem' ||
        cfg.spriteKey === 'enemy_ice_golem' ||
        cfg.spriteKey.startsWith('boss_')
      ) {
        continue;
      }
      expect(
        BEAST_SPRITE_CREATURE_SHAPE[cfg.spriteKey],
        `${id} sprite ${cfg.spriteKey} should be a creature silhouette`,
      ).toBeDefined();
    }
  });
});
