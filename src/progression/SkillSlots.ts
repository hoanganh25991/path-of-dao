/** Combat skill bar — up to six indexed slots (no primary/secondary naming). */
export const MAX_SKILL_SLOTS = 6;

export type SkillSlotIndex = 0 | 1 | 2 | 3 | 4 | 5;

export const SKILL_SLOT_INDICES: SkillSlotIndex[] = [0, 1, 2, 3, 4, 5];

export type SkillSlot = SkillSlotIndex;

/** Save field `divineArts` — six indexed slots, `''` = empty (track 30 rename, was `equippedSkills`). */
export type DivineArtsLoadout = [
  string,
  string,
  string,
  string,
  string,
  string,
];

export type SkillActionId = `skill${SkillSlotIndex}`;

export function emptyDivineArts(): DivineArtsLoadout {
  return ['', '', '', '', '', ''];
}

export function skillActionId(index: SkillSlotIndex): SkillActionId {
  return `skill${index}`;
}

export function skillSlotFromAction(action: SkillActionId): SkillSlotIndex {
  return Number(action.replace('skill', '')) as SkillSlotIndex;
}

export type SkillCooldownEntry = { remainingMs: number; totalMs: number };

export type SkillCooldownState = Record<SkillSlotIndex, SkillCooldownEntry>;

export function createSkillCooldownState(): SkillCooldownState {
  return {
    0: { remainingMs: 0, totalMs: 0 },
    1: { remainingMs: 0, totalMs: 0 },
    2: { remainingMs: 0, totalMs: 0 },
    3: { remainingMs: 0, totalMs: 0 },
    4: { remainingMs: 0, totalMs: 0 },
    5: { remainingMs: 0, totalMs: 0 },
  };
}

export type SkillSlotCooldowns = Record<SkillSlotIndex, number>;

export function createEmptySkillCooldowns(): SkillSlotCooldowns {
  return { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

/** Legacy `{ primary, secondary, ultimate }` or array → six-slot tuple. */
export function coerceDivineArts(raw: unknown): DivineArtsLoadout {
  if (Array.isArray(raw)) {
    const slots = raw.map((entry) => (typeof entry === 'string' ? entry : ''));
    while (slots.length < MAX_SKILL_SLOTS) slots.push('');
    return slots.slice(0, MAX_SKILL_SLOTS) as DivineArtsLoadout;
  }

  if (raw && typeof raw === 'object') {
    const legacy = raw as Partial<Record<'primary' | 'secondary' | 'ultimate' | 'skill3' | 'skill4' | 'skill5', string>>;
    if ('primary' in legacy || 'secondary' in legacy || 'ultimate' in legacy) {
      return [
        legacy.primary ?? '',
        legacy.secondary ?? '',
        legacy.ultimate ?? '',
        legacy.skill3 ?? '',
        legacy.skill4 ?? '',
        legacy.skill5 ?? '',
      ];
    }
  }

  return emptyDivineArts();
}
