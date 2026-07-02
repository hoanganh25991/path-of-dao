import type { SceneHostFactory } from '@/app/SceneRouter';
import type { ScenePayload } from '@/app/SceneId';
import { CombatSceneHost } from '@/combat/CombatSceneHost';
import { HomeSceneHost } from '@/home/HomeSceneHost';

export const createDefaultSceneHost: SceneHostFactory = (id, payload) => {
  switch (id) {
    case 'home':
      return new HomeSceneHost();
    case 'combat': {
      const combatPayload = payload as ScenePayload['combat'] | undefined;
      return new CombatSceneHost(combatPayload?.mapId ?? 'map.test.grove');
    }
    case 'story':
      throw new Error('Story scene host is not implemented yet');
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown scene id: ${_exhaustive}`);
    }
  }
};
