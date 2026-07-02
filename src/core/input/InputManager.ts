import { ActionButtons } from '@/core/input/ActionButtons';
import {
  cloneInputState,
  createEmptyInputState,
  type InputFrame,
  type InputState,
} from '@/core/input/InputState';
import { VirtualJoystick } from '@/core/input/VirtualJoystick';

function isKeyboardInputEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if ('ontouchstart' in window) return false;
  if (window.matchMedia('(pointer: coarse)').matches) return false;
  return true;
}

/** Singleton input hub — engine-agnostic; consumed by Phaser in sub-plan 07. */
export class InputManager {
  private static enabled = false;
  private static joystick: VirtualJoystick | null = null;
  private static buttons: ActionButtons | null = null;
  private static rafId: number | null = null;
  private static currentState = createEmptyInputState();
  private static keyboardMove = { x: 0, y: 0 };
  private static keyboardHeld = {
    attack: false,
    skill: false,
    dodge: false,
  };
  private static keyboardPressed = {
    attack: false,
    skill: false,
    dodge: false,
  };
  private static keyboardReleased = {
    attack: false,
    skill: false,
    dodge: false,
  };
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

    const attack = InputManager.readButtonState('attack');
    const skill = InputManager.readButtonState('skill');
    const dodge = InputManager.readButtonState('dodge');

    InputManager.currentState = {
      move,
      attack,
      skill,
      dodge,
    };

    return {
      state: cloneInputState(InputManager.currentState),
      timestamp: performance.now(),
    };
  }

  static consume(): InputState {
    const snapshot = cloneInputState(InputManager.currentState);

    InputManager.buttons?.clearEdgeFlags();
    InputManager.clearKeyboardEdgeFlags();

    InputManager.currentState.attack.pressed = false;
    InputManager.currentState.attack.released = false;
    InputManager.currentState.skill.pressed = false;
    InputManager.currentState.skill.released = false;
    InputManager.currentState.dodge.pressed = false;
    InputManager.currentState.dodge.released = false;

    return snapshot;
  }

  /** @internal Exposed for unit tests. */
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

  private static readButtonState(action: 'attack' | 'skill' | 'dodge') {
    const fromButtons = InputManager.buttons?.getSnapshot(action);
    const held = (fromButtons?.held ?? false) || InputManager.keyboardHeld[action];
    const pressed = (fromButtons?.pressed ?? false) || InputManager.keyboardPressed[action];
    const released = (fromButtons?.released ?? false) || InputManager.keyboardReleased[action];
    return { held, pressed, released };
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

  private static onKeyDown = (event: KeyboardEvent): void => {
    if (!InputManager.enabled || event.repeat) return;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        InputManager.keyboardMove.y = -1;
        break;
      case 'KeyS':
      case 'ArrowDown':
        InputManager.keyboardMove.y = 1;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        InputManager.keyboardMove.x = -1;
        break;
      case 'KeyD':
      case 'ArrowRight':
        InputManager.keyboardMove.x = 1;
        break;
      case 'KeyJ':
      case 'KeyZ':
        InputManager.pressKeyboardAction('attack');
        break;
      case 'KeyK':
      case 'KeyX':
        InputManager.pressKeyboardAction('skill');
        break;
      case 'KeyL':
      case 'KeyC':
        InputManager.pressKeyboardAction('dodge');
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  private static onKeyUp = (event: KeyboardEvent): void => {
    if (!InputManager.enabled) return;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        if (InputManager.keyboardMove.y < 0) InputManager.keyboardMove.y = 0;
        break;
      case 'KeyS':
      case 'ArrowDown':
        if (InputManager.keyboardMove.y > 0) InputManager.keyboardMove.y = 0;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        if (InputManager.keyboardMove.x < 0) InputManager.keyboardMove.x = 0;
        break;
      case 'KeyD':
      case 'ArrowRight':
        if (InputManager.keyboardMove.x > 0) InputManager.keyboardMove.x = 0;
        break;
      case 'KeyJ':
      case 'KeyZ':
        InputManager.releaseKeyboardAction('attack');
        break;
      case 'KeyK':
      case 'KeyX':
        InputManager.releaseKeyboardAction('skill');
        break;
      case 'KeyL':
      case 'KeyC':
        InputManager.releaseKeyboardAction('dodge');
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  private static onWindowBlur = (): void => {
    InputManager.resetKeyboardState();
  };

  private static pressKeyboardAction(action: 'attack' | 'skill' | 'dodge'): void {
    if (InputManager.keyboardHeld[action]) return;
    InputManager.keyboardHeld[action] = true;
    InputManager.keyboardPressed[action] = true;
    InputManager.keyboardReleased[action] = false;
  }

  private static releaseKeyboardAction(action: 'attack' | 'skill' | 'dodge'): void {
    if (!InputManager.keyboardHeld[action]) return;
    InputManager.keyboardHeld[action] = false;
    InputManager.keyboardReleased[action] = true;
  }

  private static clearKeyboardEdgeFlags(): void {
    InputManager.keyboardPressed.attack = false;
    InputManager.keyboardPressed.skill = false;
    InputManager.keyboardPressed.dodge = false;
    InputManager.keyboardReleased.attack = false;
    InputManager.keyboardReleased.skill = false;
    InputManager.keyboardReleased.dodge = false;
  }

  private static resetKeyboardState(): void {
    InputManager.keyboardMove = { x: 0, y: 0 };
    InputManager.keyboardHeld = { attack: false, skill: false, dodge: false };
    InputManager.clearKeyboardEdgeFlags();
  }
}
