import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { I18nManager } from '@/core/i18n/I18nManager';
import {
  isAwakenedSkillId,
  renderSkillButtonHtml,
  skillButtonAriaLabel,
  type SkillSlotId,
} from '@/ui/skills/SkillIcon';

export type ActionButtonId =
  | 'attack'
  | 'dodge'
  | 'skillPrimary'
  | 'skillSecondary'
  | 'skillUltimate';

export interface ActionButtonSnapshot {
  held: boolean;
  pressed: boolean;
  released: boolean;
}

interface ButtonLayout {
  id: ActionButtonId;
  className: string;
  slot?: SkillSlotId;
  iconHtml: string;
  ariaLabel: string;
}

const STATIC_BUTTONS: Omit<ButtonLayout, 'slot'>[] = [
  {
    id: 'attack',
    className: 'action-btn--attack',
    iconHtml: '<span class="skill-btn__icon skill-btn__icon--attack">⚔</span>',
    ariaLabel: 'Attack',
  },
  {
    id: 'dodge',
    className: 'action-btn--dodge',
    iconHtml: '<span class="skill-btn__icon skill-btn__icon--dodge">💨</span>',
    ariaLabel: 'Dodge',
  },
];

const SKILL_SLOTS: Array<{ id: ActionButtonId; slot: SkillSlotId; className: string }> = [
  { id: 'skillSecondary', slot: 'secondary', className: 'action-btn--skill-secondary' },
  { id: 'skillPrimary', slot: 'primary', className: 'action-btn--skill-primary' },
  { id: 'skillUltimate', slot: 'ultimate', className: 'action-btn--skill-ultimate' },
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
      slot?: SkillSlotId;
    }
  >();
  private unsubscribers: Array<() => void> = [];

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'action-buttons';

    const skillsRow = document.createElement('div');
    skillsRow.className = 'action-buttons__skills';

    for (const { id, slot, className } of SKILL_SLOTS) {
      this.mountButton(skillsRow, {
        id,
        slot,
        className,
        iconHtml: '',
        ariaLabel: slot,
      });
    }

    const combatRow = document.createElement('div');
    combatRow.className = 'action-buttons__combat';

    for (const layout of STATIC_BUTTONS) {
      this.mountButton(combatRow, layout);
    }

    this.element.append(skillsRow, combatRow);
    container.appendChild(this.element);

    this.unsubscribers.push(
      EventBus.on('scene:changed', () => this.syncFromSave()),
      EventBus.on('demo:entered', () => this.syncFromSave()),
    );
    this.syncFromSave();
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
    } else {
      this.syncFromSave();
    }
  }

  syncFromSave(): void {
    const save = gameStore.getState().save;
    if (!save) return;

    for (const { id, slot } of SKILL_SLOTS) {
      const state = this.buttons.get(id);
      if (!state) continue;

      const skillId = save.equippedSkills[slot];
      state.el.innerHTML = renderSkillButtonHtml(skillId);
      state.el.setAttribute('aria-label', skillButtonAriaLabel(skillId, slot));
      state.el.classList.toggle('action-btn--awakened', isAwakenedSkillId(skillId));
      state.el.dataset.skillId = skillId;
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

  clearEdgeFlags(): void {
    for (const state of this.buttons.values()) {
      state.pressed = false;
      state.released = false;
    }
  }

  simulatePress(id: ActionButtonId): void {
    this.onPointerDown(id);
  }

  simulateRelease(id: ActionButtonId): void {
    this.onPointerUp(id);
  }

  destroy(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.element.remove();
    this.buttons.clear();
  }

  private mountButton(parent: HTMLElement, layout: ButtonLayout): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action-btn ${layout.className}`;
    button.dataset.action = layout.id;
    button.setAttribute('aria-label', layout.ariaLabel);
    button.innerHTML = layout.iconHtml;

    button.addEventListener('pointerdown', (event) => {
      if (!this.enabled) return;
      event.preventDefault();
      this.onPointerDown(layout.id);
    });

    button.addEventListener('pointerup', () => this.onPointerUp(layout.id));
    button.addEventListener('pointerleave', () => this.onPointerUp(layout.id));
    button.addEventListener('pointercancel', () => this.onPointerUp(layout.id));

    this.buttons.set(layout.id, {
      el: button,
      held: false,
      pressed: false,
      released: false,
      slot: layout.slot,
    });
    parent.appendChild(button);
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

/** @internal Skill slot labels for loadout UI. */
export function skillSlotLabel(slot: SkillSlotId): string {
  return I18nManager.t(`demo.skills.slot.${slot}`);
}
