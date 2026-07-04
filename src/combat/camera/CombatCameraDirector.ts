import type Phaser from 'phaser';
import { zoomForActiveEnemies } from '@/combat/systems/EncounterScaling';

const ZOOM_LERP = 0.06;
const COMBAT_ZOOM_FLOOR = 0.52;
const COMBAT_ZOOM_CEIL = 1.12;

/**
 * Smooth combat zoom from live enemy count — close for duels, wide for horde AOE reads.
 */
export class CombatCameraDirector {
  private targetZoom = 0.88;
  private readonly baseZoom: number;

  constructor(
    private readonly camera: Phaser.Cameras.Scene2D.Camera,
    baseZoom = 0.88,
  ) {
    this.baseZoom = baseZoom;
    this.targetZoom = baseZoom;
  }

  /** Call each frame with count of enemies that can still fight (not defeated). */
  update(activeEnemyCount: number, dtMs: number): void {
    const tierZoom = zoomForActiveEnemies(Math.max(1, activeEnemyCount));
    this.targetZoom = Phaser.Math.Clamp(tierZoom, COMBAT_ZOOM_FLOOR, COMBAT_ZOOM_CEIL);

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
