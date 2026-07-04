import type { PlayerSaveV1 } from '@/core/save/SaveSchema';

const INTRO_PREFIX = 'intro:';

export function mapIntroStoryKey(mapId: string): string {
  return `${INTRO_PREFIX}${mapId}`;
}

export function shouldShowMapIntro(mapId: string, save: PlayerSaveV1): boolean {
  return !save.progress.storySeen.includes(mapIntroStoryKey(mapId));
}

export function markMapIntroSeen(mapId: string, save: PlayerSaveV1): Partial<PlayerSaveV1> {
  const key = mapIntroStoryKey(mapId);
  if (save.progress.storySeen.includes(key)) return {};
  return {
    progress: {
      ...save.progress,
      storySeen: [...save.progress.storySeen, key],
    },
  };
}
