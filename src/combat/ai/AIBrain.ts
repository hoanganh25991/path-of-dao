import type { AIDecider } from '@/combat/ai/AITypes';
import type { EnemyArchetype } from '@/combat/enemies/EnemyConfig';
import { MeleeChaserAI } from '@/combat/ai/MeleeChaserAI';
import { RangedKiterAI } from '@/combat/ai/RangedKiterAI';
import { PatrolAI } from '@/combat/ai/PatrolAI';
import { StationaryAI } from '@/combat/ai/StationaryAI';

/**
 * Archetype dispatcher. Deciders may hold per-enemy state (PatrolAI), so a
 * fresh instance is created per enemy spawn.
 */
export function createDecider(archetype: EnemyArchetype): AIDecider {
  switch (archetype) {
    case 'melee_chaser':
      return new MeleeChaserAI();
    case 'ranged_kiter':
      return new RangedKiterAI();
    case 'patrol':
      return new PatrolAI();
    case 'stationary':
      return new StationaryAI();
    case 'boss':
      // Phase-script bosses land in sub-plan 23; chase behavior until then.
      return new MeleeChaserAI();
  }
}
