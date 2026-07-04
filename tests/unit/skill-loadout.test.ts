import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import {
  assignSkillToSlot,
  listAssignableSkillPool,
  listAssignableSkills,
  listDiscoveredIntentIds,
  listUnlockedSkillIds,
  normalizeLoadout,
  canCastEquippedSkill,
} from '@/progression/SkillLoadout';
import { MEDITATE_SKILL_ID } from '@/progression/BuiltinSkills';
import { unlockSkillIds } from '@/progression/SkillUnlockManager';

describe('SkillLoadout', () => {
  it('starts with no unlocked skills on a fresh save', () => {
    const save = SaveManager.createNew();
    expect(listUnlockedSkillIds(save)).toEqual([]);
    expect(listDiscoveredIntentIds(save)).toEqual([]);
  });

  it('does not include gather qi in assignable pool — it lives on the health button', () => {
    const save = SaveManager.createNew();
    expect(listAssignableSkillPool(save)).not.toContain(MEDITATE_SKILL_ID);
  });

  it('discovers intents after earning a skill', () => {
    const save = unlockSkillIds(SaveManager.createNew(), ['skill.flame.bolt']);
    expect(listDiscoveredIntentIds(save)).toContain('flame');
    expect(listUnlockedSkillIds(save)).toContain('skill.flame.bolt');
  });

  const pool = [
    'skill.void.slash',
    'skill.sword.slash',
    'skill.flame.bolt',
    'skill.lightning.strike',
  ];

  it('normalizeLoadout keeps duplicate assignments when valid', () => {
    const loadout = normalizeLoadout(
      {
        primary: 'skill.void.slash',
        secondary: 'skill.void.slash',
        ultimate: 'skill.flame.bolt',
      },
      pool,
    );
    expect(loadout.primary).toBe('skill.void.slash');
    expect(loadout.secondary).toBe('skill.void.slash');
    expect(loadout.ultimate).toBe('skill.flame.bolt');
  });

  it('assignSkillToSlot allows duplicates across slots', () => {
    const next = assignSkillToSlot(
      {
        primary: 'skill.void.slash',
        secondary: 'skill.sword.slash',
        ultimate: 'skill.flame.bolt',
      },
      'ultimate',
      'skill.void.slash',
    );
    expect(next.ultimate).toBe('skill.void.slash');
    expect(next.secondary).toBe('skill.sword.slash');
    expect(next.primary).toBe('skill.void.slash');
  });

  it('listAssignableSkills returns the full pool', () => {
    const loadout = {
      primary: 'skill.void.slash',
      secondary: 'skill.sword.slash',
      ultimate: 'skill.flame.bolt',
    };
    expect(listAssignableSkills(loadout, 'primary', pool)).toEqual(pool);
  });

  it('cannot cast meditate from a skill slot even if legacy save still lists it', () => {
    const save = SaveManager.createNew();
    save.equippedSkills.secondary = MEDITATE_SKILL_ID;
    expect(canCastEquippedSkill(save, 'secondary')).toBe(false);
  });
});
