import Phaser from 'phaser';
import { engagementBoostCap, zoomForActiveEnemies } from '@/combat/systems/EncounterScaling';

const ZOOM_LERP = 0.06;
const COMBAT_ZOOM_FLOOR = 0.52;
const COMBAT_ZOOM_CEIL = 1.12;
const ENGAGEMENT_DECAY_PER_SEC = 0.22;

export type CombatEngagementKind = 'attack' | 'skill';

/** Re-export for callers that only need the cap formula. */
export { engagementBoostCap };

/**
 * Smooth combat zoom from live cultivator count — close for duels, wide for horde AOE reads.
 * Brief engagement pulses zoom in on strikes; mass fights stay wide so AOE reads clearly.
 */
export class CombatCameraDirector {
  private targetZoom = 0.88;
  private engagementBoost = 0;
  private readonly baseZoom: number;

  constructor(
    private readonly camera: Phaser.Cameras.Scene2D.Camera,
    baseZoom = 0.88,
  ) {
    this.baseZoom = baseZoom;
    this.targetZoom = baseZoom;
  }

  /** Pulse closer when the player strikes — capped by how crowded the exchange is. */
  notifyEngagement(activeCultivatorCount: number, kind: CombatEngagementKind): void {
    const cap = engagementBoostCap(activeCultivatorCount);
    if (cap <= 0) return;
    const step = kind === 'skill' ? cap * 0.65 : cap * 0.45;
    this.engagementBoost = Math.min(cap, this.engagementBoost + step);
  }

  /** Call each frame with count of cultivators that can still fight (not defeated). */
  update(activeCultivatorCount: number, dtMs: number): void {
    const count = Math.max(1, activeCultivatorCount);
    const tierZoom = zoomForActiveEnemies(count);
    this.engagementBoost = Math.max(
      0,
      this.engagementBoost - (dtMs / 1000) * ENGAGEMENT_DECAY_PER_SEC,
    );
    this.targetZoom = Phaser.Math.Clamp(
      tierZoom + this.engagementBoost,
      COMBAT_ZOOM_FLOOR,
      COMBAT_ZOOM_CEIL,
    );

    const t = Math.min(1, (dtMs / 1000) * (ZOOM_LERP * 60));
    const next = Phaser.Math.Linear(this.camera.zoom, this.targetZoom, t);
    this.camera.setZoom(next);
  }

  /** Snap zoom when entering ancient echo or other override modes. */
  setBaseZoom(zoom: number): void {
    this.targetZoom = zoom;
    this.camera.setZoom(zoom);
  }

  reset(): void {
    this.setBaseZoom(this.baseZoom);
  }
}
