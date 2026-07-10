import type Phaser from 'phaser';
import type { BaseStats } from '@/progression/types';
import type { DamageResult } from '@/progression/types';
import type { Hitbox } from '@/combat/combat/Hitbox';

export type CombatTeam = 'player' | 'cultivator';

/** Sticky-man sprites use feet origin — torso center for projectile overlap. */
export const HURT_CENTER_Y_RATIO = 0.45;

/** Entity that can receive hits from the opposing team. */
export interface HurtboxEntity {
  readonly id: string;
  readonly team: CombatTeam;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly x: number;
  readonly y: number;
  /** Vertical center of the hurt volume (torso for humanoid sprites). */
  readonly hurtCenterY: number;
  readonly hurtRadius: number;
  readonly invulnerable: boolean;
  /** True when this target counts as a boss for insight XP. */
  readonly isBoss?: boolean;
  getDefenderStats(): BaseStats;
  /** Apply resolved damage + optional knockback from the hitbox origin. */
  receiveHit(result: DamageResult, hitbox: Hitbox): void;
}

/** Default hurt radius from arcade body size. */
export function hurtRadiusFromBody(width: number, height: number): number {
  return Math.max(width, height) * 0.45;
}

/** Torso hurt center from feet-anchored sprite position. */
export function hurtCenterYFromSprite(sprite: Phaser.Physics.Arcade.Sprite): number {
  return sprite.y - sprite.displayHeight * HURT_CENTER_Y_RATIO;
}
