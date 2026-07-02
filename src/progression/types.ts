/**
 * Canonical stat model shared by combat, save, and progression systems.
 * Pure types — no Phaser/Three imports allowed in this module.
 */

export interface BaseStats {
  level: number;
  hpMax: number;
  manaMax: number;
  atk: number;
  def: number;
  /** Crit chance, 0.0–1.0 (clamped to 0.75 after modifiers). */
  crit: number;
  /** Crit damage multiplier, default 1.5 (clamped to [1.2, 3.0]). */
  critDmg: number;
  /** Movement multiplier, base 100 (clamped to [50, 200]). */
  speed: number;
  /** Cultivation resource; also spirit damage base. */
  spirit: number;
}

export interface RuntimeStats extends BaseStats {
  hp: number;
  mana: number;
}

/** Stats that equipment/buff modifiers may target (level excluded). */
export type ModifiableStat = Exclude<keyof BaseStats, 'level'>;

export type DamageType = 'physical' | 'spirit';

export interface DamageInput {
  attacker: BaseStats;
  defender: BaseStats;
  /** 1.0 = basic attack. */
  skillMultiplier: number;
  damageType: DamageType;
  /** 0–0.5, boss skills. */
  ignoreDefPct?: number;
}

export interface DamageResult {
  /** Damage before crit and flooring. */
  raw: number;
  /** Final integer damage, >= 1. */
  final: number;
  isCrit: boolean;
  /** Amount removed by mitigation. */
  blocked: number;
}
