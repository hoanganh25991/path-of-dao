export interface Vec2 {
  x: number;
  y: number;
}

export interface ButtonState {
  /** True on the frame the button was pressed down. */
  pressed: boolean;
  /** True while the button is held down. */
  held: boolean;
  /** True on the frame the button was released. */
  released: boolean;
}

export type SkillSlot = 'primary' | 'secondary' | 'ultimate';

export interface InputState {
  /** Normalized -1..1 move vector; deadzone applied. Up = negative y. */
  move: Vec2;
  attack: ButtonState;
  dodge: ButtonState;
  skillPrimary: ButtonState;
  skillSecondary: ButtonState;
  skillUltimate: ButtonState;
}

export interface InputFrame {
  state: InputState;
  timestamp: number;
}

export function createEmptyButtonState(): ButtonState {
  return { pressed: false, held: false, released: false };
}

export function createEmptyInputState(): InputState {
  return {
    move: { x: 0, y: 0 },
    attack: createEmptyButtonState(),
    dodge: createEmptyButtonState(),
    skillPrimary: createEmptyButtonState(),
    skillSecondary: createEmptyButtonState(),
    skillUltimate: createEmptyButtonState(),
  };
}

export function cloneInputState(state: InputState): InputState {
  return {
    move: { x: state.move.x, y: state.move.y },
    attack: { ...state.attack },
    dodge: { ...state.dodge },
    skillPrimary: { ...state.skillPrimary },
    skillSecondary: { ...state.skillSecondary },
    skillUltimate: { ...state.skillUltimate },
  };
}
