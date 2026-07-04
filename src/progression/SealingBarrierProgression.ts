import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { canEnter, isChapterComplete } from '@/progression/WorldProgression';

/** How clearly Phong Giới Đại Trận appears on the cosmic world map. */
export type SealingBarrierStage =
  | 'whisper'
  | 'sense'
  | 'approach'
  | 'behold'
  | 'revealed';

const LORE_ID = 'lore.phong_gioi.phong_ton';

export function getSealingBarrierStage(save: PlayerSaveV1): SealingBarrierStage {
  if (
    isChapterComplete('chapter.10.void_throne', save)
    || canEnter('map.void_throne.01', save).ok
  ) {
    return 'revealed';
  }
  if (
    isChapterComplete('chapter.09.heavenly_gate', save)
    || canEnter('map.heavenly_gate.01', save).ok
  ) {
    return 'behold';
  }
  if (
    isChapterComplete('chapter.07.frozen_palace', save)
    || canEnter('map.abyss_rift.01', save).ok
  ) {
    return 'approach';
  }
  if (
    isChapterComplete('chapter.04.moon_lake', save)
    || canEnter('map.burning_desert.01', save).ok
  ) {
    return 'sense';
  }
  return 'whisper';
}

export function isPhongTonLoreUnlocked(save: PlayerSaveV1): boolean {
  return getSealingBarrierStage(save) === 'revealed'
    || save.progress.loreUnlocked.includes(LORE_ID);
}

export function getPhongTonLoreId(): string {
  return LORE_ID;
}
