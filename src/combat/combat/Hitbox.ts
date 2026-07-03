import type { DamageType } from '@/progression/types';
import type { BaseStats } from '@/progression/types';

export type HitboxShape =
  | { kind: 'circle'; radius: number; x: number; y: number }
  | { kind: 'arc'; radius: number; startAngle: number; endAngle: number; x: number; y: number }
  | { kind: 'rect'; width: number; height: number; x: number; y: number };

export interface DamagePayload {
  attacker: BaseStats;
  skillMultiplier: number;
  damageType: DamageType;
  ignoreDefPct?: number;
  attackerRealmOrder?: number;
  defenderRecommendedRealmOrder?: number;
}

export interface HitboxConfig {
  ownerId: string;
  team: 'player' | 'enemy';
  shape: HitboxShape;
  damage: DamagePayload;
  lifetimeMs: number;
  knockback?: number;
  /** Pull target toward hit origin (void awakening). */
  pullForce?: number;
  hitStunMs?: number;
  /** Insight intent tagged on player skill hits. */
  insightIntent?: string;
  /** Targets hit before the hitbox expires; default 1. */
  pierce?: number;
}

let nextHitboxId = 1;

/** Active attack volume — position may be updated each frame (projectiles). */
export class Hitbox {
  readonly id: string;
  readonly ownerId: string;
  readonly team: 'player' | 'enemy';
  shape: HitboxShape;
  readonly damage: DamagePayload;
  readonly knockback?: number;
  readonly pullForce?: number;
  readonly hitStunMs?: number;
  readonly insightIntent?: string;
  readonly lifetimeMs: number;
  elapsedMs = 0;
  pierceRemaining: number;
  readonly alreadyHit = new Set<string>();

  constructor(config: HitboxConfig) {
    this.id = `hb_${nextHitboxId++}`;
    this.ownerId = config.ownerId;
    this.team = config.team;
    this.shape = config.shape;
    this.damage = config.damage;
    this.knockback = config.knockback;
    this.pullForce = config.pullForce;
    this.hitStunMs = config.hitStunMs;
    this.insightIntent = config.insightIntent;
    this.lifetimeMs = config.lifetimeMs;
    this.pierceRemaining = config.pierce ?? 1;
  }

  get expired(): boolean {
    return this.elapsedMs >= this.lifetimeMs || this.pierceRemaining <= 0;
  }
}
