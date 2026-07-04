import type { SkillDefinition } from '@/progression/SkillDefinition';
import {
  getSkillCooldownMs,
  tickCooldowns,
} from '@/progression/SkillCooldown';
import {
  createEmptySkillCooldowns,
  createSkillCooldownState,
  type SkillCooldownState,
  type SkillSlotCooldowns,
} from '@/progression/SkillSlots';
import type { SkillSlot } from '@/core/input/InputState';

export interface CooldownSnapshot {
  remainingMs: number;
  totalMs: number;
}

/** Per-slot skill cooldown tracking. */
export class CooldownManager {
  private readonly remaining: SkillSlotCooldowns = createEmptySkillCooldowns();
  private readonly totals: SkillSlotCooldowns = createEmptySkillCooldowns();

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

  snapshot(): SkillCooldownState {
    const state = createSkillCooldownState();
    for (const slot of [0, 1, 2, 3, 4, 5] as const) {
      state[slot] = {
        remainingMs: this.remaining[slot],
        totalMs: this.totals[slot],
      };
    }
    return state;
  }
}
