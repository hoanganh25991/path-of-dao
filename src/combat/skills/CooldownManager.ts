import type { SkillSlot } from '@/core/input/InputState';
import {
  createEmptyCooldowns,
  getSkillCooldownMs,
  tickCooldowns,
  type SkillSlotCooldowns,
} from '@/progression/SkillCooldown';
import type { SkillDefinition } from '@/progression/SkillDefinition';

export interface CooldownSnapshot {
  remainingMs: number;
  totalMs: number;
}

/** Per-slot skill cooldown tracking (sub-plan 19 §8). */
export class CooldownManager {
  private readonly remaining: SkillSlotCooldowns = createEmptyCooldowns();
  private readonly totals: SkillSlotCooldowns = createEmptyCooldowns();

  isReady(slot: SkillSlot): boolean {
    return this.remaining[slot] <= 0;
  }

  remainingMs(slot: SkillSlot): number {
    return this.remaining[slot];
  }

  start(slot: SkillSlot, skill: SkillDefinition, godMode = false): void {
    const ms = getSkillCooldownMs(skill, godMode);
    this.remaining[slot] = ms;
    this.totals[slot] = ms;
  }

  tick(dtMs: number): void {
    tickCooldowns(this.remaining, dtMs);
  }

  snapshot(): Record<SkillSlot, CooldownSnapshot> {
    return {
      primary: { remainingMs: this.remaining.primary, totalMs: this.totals.primary },
      secondary: { remainingMs: this.remaining.secondary, totalMs: this.totals.secondary },
      ultimate: { remainingMs: this.remaining.ultimate, totalMs: this.totals.ultimate },
    };
  }
}
