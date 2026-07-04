import type { SkillDefinition } from '@/progression/SkillDefinition';
import {
  createEmptySkillCooldowns,
  SKILL_SLOT_INDICES,
  type SkillSlotCooldowns,
  type SkillSlotIndex,
} from '@/progression/SkillSlots';

export type { SkillSlotCooldowns };

export function getSkillCooldownMs(skill: SkillDefinition, godMode = false): number {
  const base =
    skill.cooldownMs ??
    (skill.kind === 'arc' ? 850 : skill.kind === 'bolt' ? 1050 : 1400);
  const awakened = skill.id.endsWith('.awakened') ? base * 0.85 : base;
  return godMode ? Math.floor(awakened * 0.4) : Math.floor(awakened);
}

export function tickCooldowns(cooldowns: SkillSlotCooldowns, dtMs: number): void {
  for (const slot of SKILL_SLOT_INDICES) {
    if (cooldowns[slot] > 0) {
      cooldowns[slot] = Math.max(0, cooldowns[slot] - dtMs);
    }
  }
}

export function cooldownReadyPct(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - remainingMs / totalMs));
}

export { createEmptySkillCooldowns as createEmptyCooldowns };
