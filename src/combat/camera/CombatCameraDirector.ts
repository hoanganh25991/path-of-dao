import { engagementBoostCap, zoomForActiveEnemies } from '@/combat/systems/EncounterScaling';

const ZOOM_LERP = 0.10;
/** Snappier lerp when punching in on attack or holding meditate close-up. */
const ZOOM_LERP_FOCUS = 0.22;
const COMBAT_ZOOM_FLOOR = 0.50;
const COMBAT_ZOOM_CEIL = 1.75;
/** Attack punch settles back so the close-up reads as a hit, not a permanent zoom. */
const ENGAGEMENT_DECAY_PER_SEC = 0.45;
/** Floor so every strike still punches in — density only softens the peak. */
const ACTION_PUNCH_FLOOR = 0.35;
/** Intimate close-up while seated gathering qi. */
export const MEDITATE_ZOOM = 1.55;

export type CombatEngagementKind = 'attack' | 'skill';

/** Minimal camera surface — avoids pulling Phaser into unit tests. */
export interface CombatZoomCamera {
  zoom: number;
  setZoom(zoom: number): void;
}

/** Re-export for callers that only need the cap formula. */
export { engagementBoostCap };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smooth combat zoom from live cultivator count — close for duels, wide for horde AOE reads.
 * Attack/skill pulses punch in; seated gather-qi holds a sustained close-up.
 */
export class CombatCameraDirector {
  private targetZoom = 0.88;
  private engagementBoost = 0;
  private meditating = false;
  private readonly baseZoom: number;

  constructor(
    private readonly camera: CombatZoomCamera,
    baseZoom = 0.88,
  ) {
    this.baseZoom = baseZoom;
    this.targetZoom = baseZoom;
  }

  /** Pulse closer when the player strikes — always noticeable, softer in crowds. */
  notifyEngagement(activeCultivatorCount: number, kind: CombatEngagementKind): void {
    const densityCap = engagementBoostCap(activeCultivatorCount);
    const cap = Math.max(densityCap, ACTION_PUNCH_FLOOR);
    const step = kind === 'skill' ? cap * 0.95 : cap * 0.85;
    this.engagementBoost = Math.min(cap, this.engagementBoost + step);
  }

  /** Hold a close zoom while the player sits to gather qi; release on cancel/end. */
  setMeditating(active: boolean): void {
    this.meditating = active;
  }

  /** Call each frame with count of cultivators that can still fight (not defeated). */
  update(activeCultivatorCount: number, dtMs: number): void {
    const count = Math.max(1, activeCultivatorCount);
    const tierZoom = zoomForActiveEnemies(count);
    this.engagementBoost = Math.max(
      0,
      this.engagementBoost - (dtMs / 1000) * ENGAGEMENT_DECAY_PER_SEC,
    );
    let nextTarget = tierZoom + this.engagementBoost;
    if (this.meditating) {
      nextTarget = Math.max(nextTarget, MEDITATE_ZOOM);
    }
    this.targetZoom = clamp(nextTarget, COMBAT_ZOOM_FLOOR, COMBAT_ZOOM_CEIL);

    const focusing = this.meditating || this.engagementBoost > 0.04;
    const speed = focusing ? ZOOM_LERP_FOCUS : ZOOM_LERP;
    const t = Math.min(1, (dtMs / 1000) * (speed * 60));
    const next = lerp(this.camera.zoom, this.targetZoom, t);
    this.camera.setZoom(next);
  }

  /** Snap zoom when entering ancient echo or other override modes. */
  setBaseZoom(zoom: number): void {
    this.targetZoom = zoom;
    this.camera.setZoom(zoom);
  }

  reset(): void {
    this.meditating = false;
    this.engagementBoost = 0;
    this.setBaseZoom(this.baseZoom);
  }
}
