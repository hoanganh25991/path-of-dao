import {
  MAX_SKILL_SLOTS,
  type SkillSlotIndex,
} from '@/progression/SkillSlots';

export interface Vec2 {
  x: number;
  y: number;
}

export interface ButtonState {
  pressed: boolean;
  held: boolean;
  released: boolean;
}

export type SkillSlot = SkillSlotIndex;

export type SkillButtonStates = [
  ButtonState,
  ButtonState,
  ButtonState,
  ButtonState,
  ButtonState,
  ButtonState,
];

export interface InputState {
  move: Vec2;
  attack: ButtonState;
  dodge: ButtonState;
  health: ButtonState;
  skills: SkillButtonStates;
}

export interface InputFrame {
  state: InputState;
  timestamp: number;
}

function emptyButton(): ButtonState {
  return { pressed: false, held: false, released: false };
}

export function createEmptySkillButtonStates(): SkillButtonStates {
  return Array.from({ length: MAX_SKILL_SLOTS }, emptyButton) as SkillButtonStates;
}

export function createEmptyInputState(): InputState {
  return {
    move: { x: 0, y: 0 },
    attack: emptyButton(),
    dodge: emptyButton(),
    health: emptyButton(),
    skills: createEmptySkillButtonStates(),
  };
}

export function cloneInputState(state: InputState): InputState {
  return {
    move: { x: state.move.x, y: state.move.y },
    attack: { ...state.attack },
    dodge: { ...state.dodge },
    health: { ...state.health },
    skills: state.skills.map((entry) => ({ ...entry })) as SkillButtonStates,
  };
}
