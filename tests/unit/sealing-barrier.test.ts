import { describe, expect, it } from 'vitest';
import { emptyDivineArts } from '@/progression/SkillSlots';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import {
  getPhongTonLoreId,
  getSealingBarrierStage,
  isPhongTonLoreUnlocked,
} from '@/progression/SealingBarrierProgression';
import { worldMapFileSchema } from '@/shared/schemas/world-map';
import worldMapJson from '../../content/world/world-map.json';

function makeSave(overrides: Partial<PlayerSaveV1['progress']> = {}): PlayerSaveV1 {
  return {
    version: 1,
    checksum: 'test',
    heroId: 'hero.wanderer',
    stats: {
      level: 1,
      hpMax: 100,
      manaMax: 50,
      atk: 10,
      def: 5,
      crit: 0.1,
      critDmg: 1.5,
      speed: 100,
      spirit: 0,
    },
    runtime: { hp: 100, mana: 50 },
    xp: 0,
    realm: { id: 'realm.mortal', tier: 'early', breakthroughReady: false },
    insights: {},
    divineArts: emptyDivineArts(),
    unlockedSkills: [],
    inventory: { items: [], gold: 0 },
    equipped: { weapon: null, armor: null, accessory: null, spirit: null },
    progress: {
      clearedMaps: [],
      clearedBosses: [],
      unlockedChapters: [],
      storySeen: [],
      timelineSeen: [],
      encountersFound: [],
      bestiary: [],
      loreUnlocked: [],
      journey: [],
      currentMapId: 'map.fallen_village.01',
      weaponMilestone: 'none',
      ...overrides,
    },
    cosmetics: { pet: null },
    settings: { locale: 'en', quality: 'auto', sfxVolume: 1, musicVolume: 1, fullscreen: true },
    meta: { totalPlaySeconds: 0, createdAt: '', updatedAt: '' },
    destinyPoints: { dharma: 0, divine: 0, intent: 0, unspent: 0 },
  };
}

describe('world-map schema — sealing barrier', () => {
  it('parses expanded cosmic map with barrier and stars', () => {
    const parsed = worldMapFileSchema.parse(worldMapJson);
    expect(parsed.width).toBeGreaterThanOrEqual(1600);
    expect(parsed.height).toBeGreaterThanOrEqual(1800);
    expect(parsed.sealingBarrier?.labelKey).toBe('world.barrier.name');
    expect(parsed.stars?.length).toBeGreaterThan(10);
    expect(parsed.regions).toHaveLength(10);
  });
});

describe('SealingBarrierProgression', () => {
  it('starts at whisper for new game', () => {
    expect(getSealingBarrierStage(makeSave())).toBe('whisper');
  });

  it('advances to sense after moon lake chapter gate opens desert', () => {
    const save = makeSave({
      clearedMaps: ['map.moon_lake.02'],
    });
    expect(getSealingBarrierStage(save)).toBe('sense');
  });

  it('advances to approach when abyss rift chapter unlocks', () => {
    const save = makeSave({
      clearedMaps: ['map.frozen_palace.02'],
    });
    expect(getSealingBarrierStage(save)).toBe('approach');
  });

  it('advances to behold when heavenly gate chapter unlocks', () => {
    const save = makeSave({
      clearedMaps: ['map.abyss_rift.02'],
    });
    expect(getSealingBarrierStage(save)).toBe('behold');
  });

  it('reveals Phong Tôn lore at Lôi Tiên Điện chapter', () => {
    const save = makeSave({
      clearedMaps: ['map.heavenly_gate.02'],
    });
    expect(getSealingBarrierStage(save)).toBe('revealed');
    expect(isPhongTonLoreUnlocked(save)).toBe(true);
  });

  it('respects persisted lore id', () => {
    const save = makeSave({
      loreUnlocked: [getPhongTonLoreId()],
    });
    expect(isPhongTonLoreUnlocked(save)).toBe(true);
    expect(getSealingBarrierStage(save)).toBe('whisper');
  });
});
