export type ActionButtonId = 'attack' | 'skill' | 'dodge';

export interface ActionButtonSnapshot {
  held: boolean;
  pressed: boolean;
  released: boolean;
}

const BUTTON_LAYOUT: { id: ActionButtonId; label: string; className: string }[] = [
  { id: 'skill', label: 'S', className: 'action-btn--skill' },
  { id: 'dodge', label: 'D', className: 'action-btn--dodge' },
  { id: 'attack', label: 'A', className: 'action-btn--attack' },
];

export class ActionButtons {
  readonly element: HTMLElement;

  private enabled = false;
  private readonly buttons = new Map<
    ActionButtonId,
    {
      el: HTMLButtonElement;
      held: boolean;
      pressed: boolean;
      released: boolean;
    }
  >();

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'action-buttons';

    for (const { id, label, className } of BUTTON_LAYOUT) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `action-btn ${className}`;
      button.dataset.action = id;
      button.setAttribute('aria-label', id);
      button.textContent = label;

      button.addEventListener('pointerdown', (event) => {
        if (!this.enabled) return;
        event.preventDefault();
        this.onPointerDown(id);
      });

      button.addEventListener('pointerup', () => this.onPointerUp(id));
      button.addEventListener('pointerleave', () => this.onPointerUp(id));
      button.addEventListener('pointercancel', () => this.onPointerUp(id));

      this.buttons.set(id, { el: button, held: false, pressed: false, released: false });
      this.element.appendChild(button);
    }

    container.appendChild(this.element);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      for (const state of this.buttons.values()) {
        state.held = false;
        state.pressed = false;
        state.released = false;
        state.el.classList.remove('action-btn--pressed');
      }
    }
  }

  getSnapshot(id: ActionButtonId): ActionButtonSnapshot {
    const state = this.buttons.get(id);
    if (!state) return { held: false, pressed: false, released: false };
    return {
      held: state.held,
      pressed: state.pressed,
      released: state.released,
    };
  }

  /** Clear edge flags after consume(); called by InputManager each poll tail. */
  clearEdgeFlags(): void {
    for (const state of this.buttons.values()) {
      state.pressed = false;
      state.released = false;
    }
  }

  /** For tests — simulate press without DOM. */
  simulatePress(id: ActionButtonId): void {
    this.onPointerDown(id);
  }

  /** For tests — simulate release without DOM. */
  simulateRelease(id: ActionButtonId): void {
    this.onPointerUp(id);
  }

  destroy(): void {
    this.element.remove();
    this.buttons.clear();
  }

  private onPointerDown(id: ActionButtonId): void {
    if (!this.enabled) return;

    const state = this.buttons.get(id);
    if (!state || state.held) return;

    state.held = true;
    state.pressed = true;
    state.released = false;
    state.el.classList.add('action-btn--pressed');
    this.tryHaptic();
  }

  private onPointerUp(id: ActionButtonId): void {
    const state = this.buttons.get(id);
    if (!state || !state.held) return;

    state.held = false;
    state.released = true;
    state.el.classList.remove('action-btn--pressed');
  }

  private tryHaptic(): void {
    try {
      navigator.vibrate?.(10);
    } catch {
      // Vibration API unavailable or blocked.
    }
  }
}
