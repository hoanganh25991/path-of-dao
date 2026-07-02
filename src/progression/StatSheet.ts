import { applyModifiers, type StatModifier } from '@/progression/StatModifier';
import type { BaseStats, RuntimeStats } from '@/progression/types';

/**
 * Stat container: base stats + modifier stack → resolved stats,
 * plus runtime HP/mana pools. Engine-agnostic.
 */
export class StatSheet {
  private base: BaseStats;
  private modifiers: StatModifier[];
  private resolvedStats: BaseStats;
  private hp: number;
  private mana: number;

  constructor(base: BaseStats, modifiers: StatModifier[] = []) {
    this.base = { ...base };
    this.modifiers = [...modifiers];
    this.resolvedStats = applyModifiers(this.base, this.modifiers);
    this.hp = this.resolvedStats.hpMax;
    this.mana = this.resolvedStats.manaMax;
  }

  get resolved(): Readonly<BaseStats> {
    return this.resolvedStats;
  }

  get runtime(): Readonly<RuntimeStats> {
    return { ...this.resolvedStats, hp: this.hp, mana: this.mana };
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  setBase(base: BaseStats): void {
    this.base = { ...base };
    this.recalculate();
  }

  addModifier(modifier: StatModifier): void {
    this.modifiers.push(modifier);
    this.recalculate();
  }

  removeModifier(id: string): void {
    this.modifiers = this.modifiers.filter((m) => m.id !== id);
    this.recalculate();
  }

  setModifiers(modifiers: StatModifier[]): void {
    this.modifiers = [...modifiers];
    this.recalculate();
  }

  /** Re-resolve stats; clamps runtime pools to new maxima. */
  recalculate(): void {
    this.resolvedStats = applyModifiers(this.base, this.modifiers);
    this.hp = Math.min(this.hp, this.resolvedStats.hpMax);
    this.mana = Math.min(this.mana, this.resolvedStats.manaMax);
  }

  /** Returns actual HP lost (never drives HP below 0). */
  applyDamage(amount: number): number {
    const lost = Math.min(this.hp, Math.max(0, amount));
    this.hp -= lost;
    return lost;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.resolvedStats.hpMax, this.hp + Math.max(0, amount));
  }

  restoreMana(amount: number): void {
    this.mana = Math.min(this.resolvedStats.manaMax, this.mana + Math.max(0, amount));
  }

  /** Returns false (and spends nothing) when mana is insufficient. */
  spendMana(cost: number): boolean {
    if (cost > this.mana) return false;
    this.mana -= cost;
    return true;
  }

  /** Restore pools to full (map entry, respawn). */
  refill(): void {
    this.hp = this.resolvedStats.hpMax;
    this.mana = this.resolvedStats.manaMax;
  }

  /** Set runtime pools directly (save load). Values clamped to [0, max]. */
  setRuntime(hp: number, mana: number): void {
    this.hp = Math.min(this.resolvedStats.hpMax, Math.max(0, hp));
    this.mana = Math.min(this.resolvedStats.manaMax, Math.max(0, mana));
  }
}
