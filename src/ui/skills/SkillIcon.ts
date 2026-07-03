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
  void: { icon: '◈', color: '#2a1848', glow: '#c0a0ff', label: 'Void' },
  flame: { icon: '🔥', color: '#a83018', glow: '#ffb040', label: 'Flame' },
  lightning: { icon: '⚡', color: '#284868', glow: '#ffe880', label: 'Lightning' },
  time: { icon: '⏳', color: '#384858', glow: '#a0d8ff', label: 'Time' },
  life: { icon: '✦', color: '#286848', glow: '#80ffb0', label: 'Life' },
};

export type SkillSlotId = 'primary' | 'secondary' | 'ultimate';

export function isAwakenedSkillId(skillId: string): boolean {
  return skillId.endsWith('.awakened');
}

export function getIntentVisual(intent: InsightIntentId): IntentVisual {
  return INTENT_VISUALS[intent];
}

/** Build inner HTML for a combat skill button. */
export function renderSkillButtonHtml(skillId: string): string {
  if (!skillId) {
    return '<span class="skill-btn__icon skill-btn__icon--empty">·</span>';
  }
  const def = getSkillDefinition(skillId);
  const visual = getIntentVisual(def.intent);
  const awakened = isAwakenedSkillId(skillId);
  return `
    <span class="skill-btn__icon" style="--skill-color:${visual.color};--skill-glow:${visual.glow}">${visual.icon}</span>
    ${awakened ? '<span class="skill-btn__awakened" aria-hidden="true"></span>' : ''}
  `.trim();
}

export function skillButtonAriaLabel(skillId: string, slot: SkillSlotId): string {
  if (!skillId) return `${slot} skill (empty)`;
  const def = getSkillDefinition(skillId);
  const visual = getIntentVisual(def.intent);
  const tier = isAwakenedSkillId(skillId) ? 'awakened' : 'base';
  return `${visual.label} ${slot} skill (${tier})`;
}
