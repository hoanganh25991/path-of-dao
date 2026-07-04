/** Default health-button skill — always available like dodge; not loadout-assignable. */
export const MEDITATE_SKILL_ID = 'skill.basic.meditate';

export function isMeditateSkillId(skillId: string): boolean {
  return skillId === MEDITATE_SKILL_ID;
}
