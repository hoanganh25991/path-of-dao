import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import {
  assignSkillToSlot,
  listAssignableSkillPool,
  listAssignableSkills,
  listDiscoveredIntentIds,
  listUnlockedSkillIds,
  normalizeLoadout,
  canCastDivineArt,
} from '@/progression/SkillLoadout';
import { MEDITATE_SKILL_ID } from '@/progression/BuiltinSkills';
import { unlockSkillIds } from '@/progression/SkillUnlockManager';
import type { DivineArtsLoadout } from '@/progression/SkillSlots';

describe('SkillLoadout', () => {
  it('starts with Life-and-Death mend on a fresh save', () => {
    const save = SaveManager.createNew();
    expect(listUnlockedSkillIds(save)).toEqual(['skill.life.mend']);
    expect(listDiscoveredIntentIds(save)).toEqual(['life_death']);
  });

  it('does not include gather qi in assignable pool — it lives on the health button', () => {
    const save = SaveManager.createNew();
    expect(listAssignableSkillPool(save)).not.toContain(MEDITATE_SKILL_ID);
  });

  it('discovers intents after earning a skill', () => {
    const save = unlockSkillIds(SaveManager.createNew(), ['skill.life.mend']);
    expect(listDiscoveredIntentIds(save)).toContain('life_death');
    expect(listUnlockedSkillIds(save)).toContain('skill.life.mend');
  });

  it('gate-flow skills are unlockable but stay uncastable until the milestone/boss gate is met', () => {
    const save = unlockSkillIds(SaveManager.createNew(), ['skill.flame.bolt']);
    expect(listDiscoveredIntentIds(save)).toContain('flame');
    expect(save.unlockedSkills).toContain('skill.flame.bolt');
    expect(listUnlockedSkillIds(save)).not.toContain('skill.flame.bolt');
  });

  const pool = [
    'skill.void.slash',
    'skill.sword.slash',
    'skill.flame.bolt',
    'skill.lightning.strike',
  ];

  it('normalizeLoadout keeps duplicate assignments when valid', () => {
    const loadout = normalizeLoadout(
      [
        'skill.void.slash',
        'skill.void.slash',
        'skill.flame.bolt',
        '',
        '',
        '',
      ] satisfies DivineArtsLoadout,
      pool,
    );
    expect(loadout[0]).toBe('skill.void.slash');
    expect(loadout[1]).toBe('skill.void.slash');
    expect(loadout[2]).toBe('skill.flame.bolt');
  });

  it('normalizeLoadout clears invalid skills without filling placeholders', () => {
    const loadout = normalizeLoadout(
      ['skill.invalid', '', 'skill.flame.bolt', '', '', ''] satisfies DivineArtsLoadout,
      pool,
    );
    expect(loadout[0]).toBe('');
    expect(loadout[2]).toBe('skill.flame.bolt');
  });

  it('assignSkillToSlot allows duplicates across slots', () => {
    const next = assignSkillToSlot(
      [
        'skill.void.slash',
        'skill.sword.slash',
        'skill.flame.bolt',
        '',
        '',
        '',
      ] satisfies DivineArtsLoadout,
      2,
      'skill.void.slash',
    );
    expect(next[2]).toBe('skill.void.slash');
    expect(next[1]).toBe('skill.sword.slash');
    expect(next[0]).toBe('skill.void.slash');
  });

  it('listAssignableSkills returns the full pool', () => {
    const loadout = [
      'skill.void.slash',
      'skill.sword.slash',
      'skill.flame.bolt',
      '',
      '',
      '',
    ] satisfies DivineArtsLoadout;
    expect(listAssignableSkills(loadout, 0, pool)).toEqual(pool);
  });

  it('cannot cast meditate from a skill slot even if legacy save still lists it', () => {
    const save = SaveManager.createNew();
    save.divineArts[1] = MEDITATE_SKILL_ID;
    expect(canCastDivineArt(save, 1)).toBe(false);
  });
});
