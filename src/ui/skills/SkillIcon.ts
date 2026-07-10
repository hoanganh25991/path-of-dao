import type { InsightIntentId } from '@/progression/SkillDefinition';
import { getSkillDefinition } from '@/progression/SkillLoader';

export interface IntentVisual {
  icon: string;
  color: string;
  glow: string;
  label: string;
}

export const INTENT_VISUALS: Record<InsightIntentId, IntentVisual> = {
  sword: { icon: '⚔', color: '#4a6088', glow: '#c0d8ff', label: 'Sword' },
  truth_falsehood: { icon: '◈', color: '#2a1848', glow: '#c0a0ff', label: 'Truth & Falsehood' },
  flame: { icon: '🔥', color: '#a83018', glow: '#ffb040', label: 'Flame' },
  lightning: { icon: '⚡', color: '#284868', glow: '#ffe880', label: 'Lightning' },
  cause_effect: { icon: '⏳', color: '#384858', glow: '#a0d8ff', label: 'Cause & Effect' },
  life_death: { icon: '✦', color: '#286848', glow: '#80ffb0', label: 'Life & Death' },
  basic: { icon: '🧘', color: '#585050', glow: '#c8c0b0', label: 'Basic' },
};

const SKILL_ICONS: Record<string, { icon: string; color: string; glow: string }> = {
  // Void
  'skill.void.slash': { icon: '◈', color: '#3a2860', glow: '#b090f0' },
  'skill.void.slash.awakened': { icon: '◆', color: '#4a2890', glow: '#d0a0ff' },
  'skill.void.rift.v1': { icon: '🕳', color: '#281848', glow: '#a080e0' },
  'skill.void.tear.v2': { icon: '💠', color: '#302060', glow: '#b8a0f0' },
  'skill.void.surge.v3': { icon: '🌑', color: '#201040', glow: '#c0b0ff' },
  'skill.void.nova.v4': { icon: '💥', color: '#382870', glow: '#d0c0ff' },
  'skill.void.abyss.v5': { icon: '🌌', color: '#180830', glow: '#e0d0ff' },
  // Sword
  'skill.sword.slash': { icon: '⚔', color: '#405878', glow: '#a8c8e8' },
  'skill.sword.slash.awakened': { icon: '⚡', color: '#587090', glow: '#d0f0ff' },
  'skill.sword.crescent.v1': { icon: '🌙', color: '#4870a0', glow: '#c8e0ff' },
  'skill.sword.cleave.v2': { icon: '🗡', color: '#506888', glow: '#b8d8f0' },
  'skill.sword.rain.v3': { icon: '💧', color: '#386080', glow: '#a0d0f0' },
  'skill.sword.burst.v4': { icon: '✨', color: '#6078a0', glow: '#e0f0ff' },
  'skill.sword.heaven.v5': { icon: '👑', color: '#6888b0', glow: '#f0f8ff' },
  // Flame
  'skill.flame.bolt': { icon: '🔥', color: '#a03018', glow: '#ffa040' },
  'skill.flame.bolt.awakened': { icon: '💥', color: '#b84028', glow: '#ffc060' },
  'skill.flame.scorch.v1': { icon: '🌡', color: '#c85030', glow: '#ff8040' },
  'skill.flame.ember.v2': { icon: '💀', color: '#903830', glow: '#ff7060' },
  'skill.flame.pillar.v3': { icon: '🏛', color: '#b86040', glow: '#ffb080' },
  'skill.flame.lotus.v4': { icon: '🌺', color: '#c87050', glow: '#ffc0a0' },
  // Lightning
  'skill.lightning.strike': { icon: '⚡', color: '#284868', glow: '#ffe080' },
  'skill.lightning.strike.awakened': { icon: '⚡', color: '#386088', glow: '#fff0a0' },
  'skill.lightning.fork.v1': { icon: '⛓', color: '#305878', glow: '#ffd870' },
  'skill.lightning.arc.v2': { icon: '🌈', color: '#407098', glow: '#ffe8a0' },
  'skill.lightning.storm.v3': { icon: '🌪', color: '#204058', glow: '#ffd060' },
  'skill.lightning.judgment.v4': { icon: '🔱', color: '#5080a8', glow: '#fff0c0' },
  'skill.lightning.tribulation.v5': { icon: '⛅', color: '#486880', glow: '#fff8e0' },
  // Time
  'skill.time.slow': { icon: '⏳', color: '#384858', glow: '#a0d0e0' },
  'skill.time.slow.awakened': { icon: '⌛', color: '#486068', glow: '#c0e8f0' },
  'skill.time.halt.v1': { icon: '⏸', color: '#405060', glow: '#b0d8e8' },
  'skill.time.drift.v2': { icon: '🌊', color: '#304050', glow: '#90c8d8' },
  'skill.time.loop.v3': { icon: '🔄', color: '#506870', glow: '#d0f0f8' },
  'skill.time.stasis.v4': { icon: '💎', color: '#587880', glow: '#e0f8ff' },
  'skill.time.echo.v5': { icon: '🔔', color: '#607888', glow: '#f0fcff' },
  // Life
  'skill.life.mend': { icon: '✦', color: '#286048', glow: '#80ffa0' },
  'skill.life.mend.awakened': { icon: '✿', color: '#387858', glow: '#a0ffc0' },
  'skill.life.bloom.v1': { icon: '🌸', color: '#408060', glow: '#b0ffd0' },
  'skill.life.pulse.v2': { icon: '💗', color: '#306850', glow: '#90ffb0' },
  'skill.life.surge.v3': { icon: '🌿', color: '#488868', glow: '#c0ffe0' },
  'skill.life.spirit.v4': { icon: '👻', color: '#509070', glow: '#d0fff0' },
  // Basic
  'skill.basic.meditate': { icon: '🧘', color: '#585050', glow: '#c8c0b0' },
};

export type SkillSlotId = import('@/progression/SkillSlots').SkillSlotIndex;

export function isAwakenedSkillId(skillId: string): boolean {
  return skillId.endsWith('.awakened');
}

export function getIntentVisual(intent: InsightIntentId): IntentVisual {
  return INTENT_VISUALS[intent] ?? INTENT_VISUALS.basic;
}

function getSkillVisual(skillId: string): { icon: string; color: string; glow: string } {
  const perSkill = SKILL_ICONS[skillId];
  if (perSkill) return perSkill;
  try {
    const def = getSkillDefinition(skillId);
    const intentVisual = INTENT_VISUALS[def.intent] ?? INTENT_VISUALS.basic;
    return { icon: intentVisual.icon, color: intentVisual.color, glow: intentVisual.glow };
  } catch {
    return { icon: '?', color: '#444', glow: '#888' };
  }
}

export function getSkillVfxTint(skillId: string): number {
  const visual = getSkillVisual(skillId);
  return parseInt(visual.glow.replace('#', ''), 16);
}

export function renderSkillButtonHtml(skillId: string): string {
  if (!skillId) {
    return '';
  }
  const visual = getSkillVisual(skillId);
  const awakened = isAwakenedSkillId(skillId);
  return `
    <span class="skill-btn__icon" style="--skill-color:${visual.color};--skill-glow:${visual.glow}">${visual.icon}</span>
    ${awakened ? '<span class="skill-btn__awakened" aria-hidden="true"></span>' : ''}
  `.trim();
}

export function skillButtonAriaLabel(skillId: string): string {
  if (!skillId) return 'Skill';
  try {
    const def = getSkillDefinition(skillId);
    const tier = isAwakenedSkillId(skillId) ? 'awakened' : 'base';
    return `${def.intent} skill (${tier})`;
  } catch {
    return 'Skill';
  }
}