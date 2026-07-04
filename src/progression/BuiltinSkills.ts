/** Built-in combat skills — always assignable, no unlock required. */
export const MEDITATE_SKILL_ID = 'skill.basic.meditate';

export const BUILTIN_SKILL_IDS = [MEDITATE_SKILL_ID] as const;

export type BuiltinSkillId = (typeof BUILTIN_SKILL_IDS)[number];

export function isBuiltinSkillId(skillId: string): skillId is BuiltinSkillId {
  return (BUILTIN_SKILL_IDS as readonly string[]).includes(skillId);
}

export function isMeditateSkillId(skillId: string): boolean {
  return skillId === MEDITATE_SKILL_ID;
}
