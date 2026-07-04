import {
  ActionButtons,
  isSkillActionId,
  skillSlotFromAction,
  type ActionButtonId,
} from '@/core/input/ActionButtons';
import {
  cloneInputState,
  createEmptyInputState,
  type InputFrame,
  type InputState,
} from '@/core/input/InputState';
import { VirtualJoystick } from '@/core/input/VirtualJoystick';
import {
  SKILL_SLOT_INDICES,
  skillActionId,
  type SkillActionId,
} from '@/progression/SkillSlots';

function isKeyboardInputEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if ('ontouchstart' in window) return false;
  if (window.matchMedia('(pointer: coarse)').matches) return false;
  return true;
}

type StaticCombatAction = 'attack' | 'dodge' | 'health';
type CombatAction = StaticCombatAction | SkillActionId;

const STATIC_ACTIONS: StaticCombatAction[] = ['attack', 'dodge', 'health'];
const SKILL_ACTIONS = SKILL_SLOT_INDICES.map(skillActionId);
const ALL_ACTIONS: CombatAction[] = [...STATIC_ACTIONS, ...SKILL_ACTIONS];

function emptyActionRecord(): Record<CombatAction, boolean> {
  return ALL_ACTIONS.reduce(
    (acc, key) => {
      acc[key] = false;
      return acc;
    },
    {} as Record<CombatAction, boolean>,
  );
}

/** Singleton input hub — engine-agnostic; consumed by Phaser in sub-plan 07. */
export class InputManager {
  private static enabled = false;
  private static joystick: VirtualJoystick | null = null;
  private static buttons: ActionButtons | null = null;
  private static rafId: number | null = null;
  private static currentState = createEmptyInputState();
  private static keyboardMove = { x: 0, y: 0 };
  private static keyboardHeld = emptyActionRecord();
  private static keyboardPressed = emptyActionRecord();
  private static keyboardReleased = emptyActionRecord();
  private static keyboardBound = false;

  static mount(container: HTMLElement): void {
    if (InputManager.joystick) return;
    InputManager.joystick = new VirtualJoystick(container);
    InputManager.buttons = new ActionButtons(container);
    InputManager.bindKeyboard();
    InputManager.setEnabled(false);
  }

  static destroy(): void {
    InputManager.stopPollLoop();
    InputManager.joystick?.destroy();
    InputManager.buttons?.destroy();
    InputManager.joystick = null;
    InputManager.buttons = null;
    InputManager.unbindKeyboard();
    InputManager.currentState = createEmptyInputState();
  }

  static setEnabled(enabled: boolean): void {
    InputManager.enabled = enabled;
    InputManager.joystick?.setEnabled(enabled);
    InputManager.buttons?.setEnabled(enabled);

    if (enabled) {
      InputManager.startPollLoop();
    } else {
      InputManager.stopPollLoop();
      InputManager.currentState = createEmptyInputState();
      InputManager.resetKeyboardState();
    }
  }

  static poll(): InputFrame {
    const move = InputManager.enabled
      ? InputManager.readMoveVector()
      : { x: 0, y: 0 };

    const skills = SKILL_SLOT_INDICES.map((slot) =>
      InputManager.readButtonState(skillActionId(slot)),
    ) as InputState['skills'];

    InputManager.currentState = {
      move,
      attack: InputManager.readButtonState('attack'),
      dodge: InputManager.readButtonState('dodge'),
      health: InputManager.readButtonState('health'),
      skills,
    };

    return {
      state: cloneInputState(InputManager.currentState),
      timestamp: performance.now(),
    };
  }

  static consume(): InputState {
    InputManager.poll();

    const snapshot = cloneInputState(InputManager.currentState);

    InputManager.buttons?.clearEdgeFlags();
    InputManager.clearKeyboardEdgeFlags();

    InputManager.currentState.attack.pressed = false;
    InputManager.currentState.attack.released = false;
    InputManager.currentState.dodge.pressed = false;
    InputManager.currentState.dodge.released = false;
    InputManager.currentState.health.pressed = false;
    InputManager.currentState.health.released = false;
    for (const slot of SKILL_SLOT_INDICES) {
      InputManager.currentState.skills[slot].pressed = false;
      InputManager.currentState.skills[slot].released = false;
    }

    return snapshot;
  }

  static resetForTests(): void {
    InputManager.stopPollLoop();
    InputManager.enabled = false;
    InputManager.currentState = createEmptyInputState();
    InputManager.resetKeyboardState();
  }

  private static readMoveVector(): { x: number; y: number } {
    const stick = InputManager.joystick?.getMoveVector() ?? { x: 0, y: 0 };
    if (stick.x !== 0 || stick.y !== 0) return stick;
    return { ...InputManager.keyboardMove };
  }

  private static readButtonState(action: ActionButtonId) {
    const fromButtons = InputManager.buttons?.getSnapshot(action);
    const held =
      (fromButtons?.held ?? false) ||
      (InputManager.isCombatAction(action) ? InputManager.keyboardHeld[action] : false);
    const pressed =
      (fromButtons?.pressed ?? false) ||
      (InputManager.isCombatAction(action) ? InputManager.keyboardPressed[action] : false);
    const released =
      (fromButtons?.released ?? false) ||
      (InputManager.isCombatAction(action) ? InputManager.keyboardReleased[action] : false);
    return { held, pressed, released };
  }

  private static isCombatAction(action: ActionButtonId): action is CombatAction {
    return ALL_ACTIONS.includes(action as CombatAction);
  }

  private static startPollLoop(): void {
    if (InputManager.rafId !== null) return;

    const tick = (): void => {
      InputManager.poll();
      InputManager.rafId = requestAnimationFrame(tick);
    };

    InputManager.rafId = requestAnimationFrame(tick);
  }

  private static stopPollLoop(): void {
    if (InputManager.rafId !== null) {
      cancelAnimationFrame(InputManager.rafId);
      InputManager.rafId = null;
    }
  }

  private static bindKeyboard(): void {
    if (InputManager.keyboardBound || !isKeyboardInputEnabled()) return;
    InputManager.keyboardBound = true;

    window.addEventListener('keydown', InputManager.onKeyDown);
    window.addEventListener('keyup', InputManager.onKeyUp);
    window.addEventListener('blur', InputManager.onWindowBlur);
  }

  private static unbindKeyboard(): void {
    if (!InputManager.keyboardBound) return;
    InputManager.keyboardBound = false;

    window.removeEventListener('keydown', InputManager.onKeyDown);
    window.removeEventListener('keyup', InputManager.onKeyUp);
    window.removeEventListener('blur', InputManager.onWindowBlur);
  }

  private static skillKeyBindings: Record<string, SkillActionId> = {
    Digit1: 'skill0',
    Digit2: 'skill1',
    Digit3: 'skill2',
    Digit4: 'skill3',
    Digit5: 'skill4',
    Digit6: 'skill5',
  };

  private static onKeyDown = (event: KeyboardEvent): void => {
    if (!InputManager.enabled || event.repeat) return;

    const skillAction = InputManager.skillKeyBindings[event.code];
    if (skillAction) {
      InputManager.pressKeyboardAction(skillAction);
      event.preventDefault();
      return;
    }

    switch (event.code) {
      case 'ArrowUp':
        InputManager.keyboardMove.y = -1;
        break;
      case 'ArrowDown':
        InputManager.keyboardMove.y = 1;
        break;
      case 'ArrowLeft':
        InputManager.keyboardMove.x = -1;
        break;
      case 'ArrowRight':
        InputManager.keyboardMove.x = 1;
        break;
      case 'KeyA':
        InputManager.pressKeyboardAction('attack');
        break;
      case 'KeyD':
        InputManager.pressKeyboardAction('dodge');
        break;
      case 'KeyS':
        InputManager.pressKeyboardAction('health');
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  private static onKeyUp = (event: KeyboardEvent): void => {
    if (!InputManager.enabled) return;

    const skillAction = InputManager.skillKeyBindings[event.code];
    if (skillAction) {
      InputManager.releaseKeyboardAction(skillAction);
      event.preventDefault();
      return;
    }

    switch (event.code) {
      case 'ArrowUp':
        if (InputManager.keyboardMove.y < 0) InputManager.keyboardMove.y = 0;
        break;
      case 'ArrowDown':
        if (InputManager.keyboardMove.y > 0) InputManager.keyboardMove.y = 0;
        break;
      case 'ArrowLeft':
        if (InputManager.keyboardMove.x < 0) InputManager.keyboardMove.x = 0;
        break;
      case 'ArrowRight':
        if (InputManager.keyboardMove.x > 0) InputManager.keyboardMove.x = 0;
        break;
      case 'KeyA':
        InputManager.releaseKeyboardAction('attack');
        break;
      case 'KeyD':
        InputManager.releaseKeyboardAction('dodge');
        break;
      case 'KeyS':
        InputManager.releaseKeyboardAction('health');
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  private static onWindowBlur = (): void => {
    InputManager.resetKeyboardState();
  };

  private static pressKeyboardAction(action: CombatAction): void {
    if (InputManager.keyboardHeld[action]) return;
    InputManager.keyboardHeld[action] = true;
    InputManager.keyboardPressed[action] = true;
    InputManager.keyboardReleased[action] = false;
  }

  private static releaseKeyboardAction(action: CombatAction): void {
    if (!InputManager.keyboardHeld[action]) return;
    InputManager.keyboardHeld[action] = false;
    InputManager.keyboardReleased[action] = true;
  }

  private static clearKeyboardEdgeFlags(): void {
    for (const key of ALL_ACTIONS) {
      InputManager.keyboardPressed[key] = false;
      InputManager.keyboardReleased[key] = false;
    }
  }

  private static resetKeyboardState(): void {
    InputManager.keyboardMove = { x: 0, y: 0 };
    for (const key of ALL_ACTIONS) {
      InputManager.keyboardHeld[key] = false;
    }
    InputManager.clearKeyboardEdgeFlags();
  }
}

export { isSkillActionId, skillSlotFromAction };
