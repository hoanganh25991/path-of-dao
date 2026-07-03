import type { SkillDefinition } from '@/progression/SkillDefinition';
import type { SkillSlot } from '@/core/input/InputState';

export type SkillSlotCooldowns = Record<SkillSlot, number>;

export function createEmptyCooldowns(): SkillSlotCooldowns {
  return { primary: 0, secondary: 0, ultimate: 0 };
}

/** Default cadence per skill kind (ms). */
export function getSkillCooldownMs(skill: SkillDefinition, godMode = false): number {
  const base =
    skill.cooldownMs ??
    (skill.kind === 'arc' ? 850 : skill.kind === 'bolt' ? 1050 : 1400);
  const awakened = skill.id.endsWith('.awakened') ? base * 0.85 : base;
  return godMode ? Math.floor(awakened * 0.4) : Math.floor(awakened);
}

export function tickCooldowns(cooldowns: SkillSlotCooldowns, dtMs: number): void {
  for (const slot of ['primary', 'secondary', 'ultimate'] as const) {
    if (cooldowns[slot] > 0) {
      cooldowns[slot] = Math.max(0, cooldowns[slot] - dtMs);
    }
  }
}

export function cooldownReadyPct(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - remainingMs / totalMs));
}
