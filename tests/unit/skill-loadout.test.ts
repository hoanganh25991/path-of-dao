import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import {
  assignSkillToSlot,
  listAssignableSkills,
  listDiscoveredIntentIds,
  listUnlockedSkillIds,
  normalizeLoadout,
} from '@/progression/SkillLoadout';
import { unlockSkillIds } from '@/progression/SkillUnlockManager';

describe('SkillLoadout', () => {
  it('starts with no unlocked skills on a fresh save', () => {
    const save = SaveManager.createNew();
    expect(listUnlockedSkillIds(save)).toEqual([]);
    expect(listDiscoveredIntentIds(save)).toEqual([]);
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

  it('normalizeLoadout fills three unique defaults', () => {
    const loadout = normalizeLoadout(
      {
        primary: 'skill.void.slash',
        secondary: 'skill.void.slash',
        ultimate: 'skill.flame.bolt',
      },
      pool,
    );
    const values = Object.values(loadout);
    expect(new Set(values).size).toBe(3);
    expect(values.every((id) => pool.includes(id))).toBe(true);
  });

  it('assignSkillToSlot swaps instead of duplicating', () => {
    const next = assignSkillToSlot(
      {
        primary: 'skill.void.slash',
        secondary: 'skill.sword.slash',
        ultimate: 'skill.flame.bolt',
      },
      'ultimate',
      'skill.sword.slash',
    );
    expect(next.ultimate).toBe('skill.sword.slash');
    expect(next.secondary).toBe('skill.flame.bolt');
    expect(new Set(Object.values(next)).size).toBe(3);
  });

  it('listAssignableSkills hides skills on other slots', () => {
    const loadout = {
      primary: 'skill.void.slash',
      secondary: 'skill.sword.slash',
      ultimate: 'skill.flame.bolt',
    };
    const assignable = listAssignableSkills(loadout, 'primary', pool);
    expect(assignable).toContain('skill.void.slash');
    expect(assignable).toContain('skill.lightning.strike');
    expect(assignable).not.toContain('skill.sword.slash');
    expect(assignable).not.toContain('skill.flame.bolt');
  });
});
