import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { applyEncounterReward } from '@/progression/FortuitousEncounterManager';
import { getEncounterDefinition } from '@/progression/EncounterLoader';
import {
  ANCIENT_SWORD_ITEM_ID,
  canUseSwordIntent,
  filterSkillsForWeaponGate,
  getHeroDisplayEquipment,
  hasAncientSwordMilestone,
  patchAncientSwordMilestone,
  resolveAttackStyle,
} from '@/progression/WeaponProgression';
import { listUnlockedSkillIds } from '@/progression/SkillLoadout';

describe('WeaponProgression', () => {
  it('new game starts unarmed with empty weapon slot (T4)', () => {
    const save = SaveManager.createNew();
    expect(save.equipped.weapon).toBeNull();
    expect(save.progress.weaponMilestone).toBe('none');
    expect(resolveAttackStyle(save)).toBe('unarmed');
  });

  it('hides weapon in Home display until milestone (T8)', () => {
    const save = SaveManager.createNew();
    expect(getHeroDisplayEquipment(save).weapon).toBeNull();

    const armed = {
      ...save,
      progress: { ...save.progress, weaponMilestone: 'ancient_sword' as const },
      equipped: { ...save.equipped, weapon: ANCIENT_SWORD_ITEM_ID },
    };
    expect(getHeroDisplayEquipment(armed).weapon).toBe(ANCIENT_SWORD_ITEM_ID);
  });

  it('gates sword intent skills until ancient blade (T7)', () => {
    const save = SaveManager.createNew();
    const pool = listUnlockedSkillIds(save);
    expect(pool.some((id) => id.includes('sword'))).toBe(false);
    expect(canUseSwordIntent(save)).toBe(false);

    const armed = {
      ...save,
      progress: { ...save.progress, weaponMilestone: 'ancient_sword' as const },
    };
    expect(canUseSwordIntent(armed)).toBe(true);
    expect(filterSkillsForWeaponGate(armed, ['skill.sword.slash', 'skill.void.slash'])).toContain(
      'skill.sword.slash',
    );
  });

  it('ancient sword POI sets milestone and equips blade (T2/T3)', () => {
    const save = SaveManager.createNew();
    const encounter = getEncounterDefinition('encounter.ancient_sword');
    const next = { ...save, ...applyEncounterReward(encounter, save, 'sword.fallen_village') };

    expect(hasAncientSwordMilestone(next)).toBe(true);
    expect(next.equipped.weapon).toBe(ANCIENT_SWORD_ITEM_ID);
    expect(resolveAttackStyle(next)).toBe('sword');
  });

  it('patchAncientSwordMilestone is idempotent', () => {
    const save = SaveManager.createNew();
    const first = patchAncientSwordMilestone(save, ANCIENT_SWORD_ITEM_ID);
    expect(first?.progress?.weaponMilestone).toBe('ancient_sword');

    const armed = { ...save, progress: { ...save.progress, weaponMilestone: 'ancient_sword' as const } };
    expect(patchAncientSwordMilestone(armed, ANCIENT_SWORD_ITEM_ID)).toBeNull();
  });
});
