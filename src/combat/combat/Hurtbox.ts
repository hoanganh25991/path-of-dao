import type Phaser from 'phaser';
import type { BaseStats } from '@/progression/types';
import type { DamageResult } from '@/progression/types';
import type { Hitbox } from '@/combat/combat/Hitbox';

export type CombatTeam = 'player' | 'enemy';

/** Entity that can receive hits from the opposing team. */
export interface HurtboxEntity {
  readonly id: string;
  readonly team: CombatTeam;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly x: number;
  readonly y: number;
  readonly hurtRadius: number;
  readonly invulnerable: boolean;
  getDefenderStats(): BaseStats;
  /** Apply resolved damage + optional knockback from the hitbox origin. */
  receiveHit(result: DamageResult, hitbox: Hitbox): void;
}

/** Default hurt radius from arcade body size. */
export function hurtRadiusFromBody(width: number, height: number): number {
  return Math.max(width, height) * 0.45;
}
