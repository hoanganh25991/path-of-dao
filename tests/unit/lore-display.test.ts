import { describe, expect, it } from 'vitest';
import {
  describeLoreEntry,
  findEncounterForLore,
  loreBodyForEncounter,
  loreBodyKey,
} from '@/progression/LoreDisplay';

describe('LoreDisplay', () => {
  it('maps lore id to demo body key', () => {
    expect(loreBodyKey('lore.fallen_village.memory_01')).toBe('demo.lore.fallen_village.memory_01');
  });

  it('links forgotten memory lore to its encounter', () => {
    expect(findEncounterForLore('lore.fallen_village.memory_01')).toBe('encounter.forgotten_memory');
    const view = describeLoreEntry('lore.fallen_village.memory_01');
    expect(view.titleKey).toBe('encounter.forgotten_memory.title');
    expect(view.bodyKey).toBe('demo.lore.fallen_village.memory_01');
  });

  it('returns lore id for claimed encounter rows', () => {
    expect(
      loreBodyForEncounter('encounter.forgotten_memory', ['lore.fallen_village.memory_01']),
    ).toBe('lore.fallen_village.memory_01');
    expect(loreBodyForEncounter('encounter.forgotten_memory', [])).toBeNull();
    expect(loreBodyForEncounter('encounter.spirit_beast', ['lore.fallen_village.memory_01'])).toBeNull();
  });
});
