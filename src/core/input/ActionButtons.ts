import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';
import { isAncientCombatActive } from '@/progression/AncientCombatMode';
import { canCastEquippedSkill } from '@/progression/SkillLoadout';
import { cooldownReadyPct } from '@/progression/SkillCooldown';
import {
  isAwakenedSkillId,
  renderSkillButtonHtml,
  skillButtonAriaLabel,
  type SkillSlotId,
} from '@/ui/skills/SkillIcon';

export type ActionButtonId =
  | 'attack'
  | 'dodge'
  | 'health'
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
    id: 'health',
    className: 'action-btn--health',
    iconHtml:
      '<span class="skill-btn__icon skill-btn__icon--health" style="--skill-color:#286848;--skill-glow:#80ffb0">✦</span>',
    ariaLabel: 'Gather Qi',
  },
  {
    id: 'dodge',
    className: 'action-btn--dodge',
    iconHtml: '<span class="skill-btn__icon skill-btn__icon--dodge">💨</span>',
    ariaLabel: 'Dodge',
  },
];

/** Matches loadout picker slot order: primary → secondary → ultimate. */
const SKILL_SLOTS: Array<{ id: ActionButtonId; slot: SkillSlotId; className: string }> = [
  { id: 'skillPrimary', slot: 'primary', className: 'action-btn--skill-primary' },
  { id: 'skillSecondary', slot: 'secondary', className: 'action-btn--skill-secondary' },
  { id: 'skillUltimate', slot: 'ultimate', className: 'action-btn--skill-ultimate' },
];

const SLOT_BY_BUTTON: Partial<Record<ActionButtonId, SkillSlotId>> = {
  skillPrimary: 'primary',
  skillSecondary: 'secondary',
  skillUltimate: 'ultimate',
};

export class ActionButtons {
  readonly element: HTMLElement;

  private enabled = false;
  private readonly buttons = new Map<
    ActionButtonId,
    {
      el: HTMLButtonElement;
      cooldownEl: HTMLElement;
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

    const cluster = document.createElement('div');
    cluster.className = 'action-buttons__cluster';

    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = 'action-btn action-btn--arc action-btn--swap-skills';
    swapBtn.setAttribute('aria-label', I18nManager.t('combat.skills.swap'));
    swapBtn.innerHTML = '<span class="skill-btn__icon">⟳</span>';
    swapBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!this.enabled) return;
      EventBus.emit('combat:open-skill-picker', {});
    });
    cluster.appendChild(swapBtn);

    for (const { id, slot, className } of SKILL_SLOTS) {
      this.mountSkillButton(cluster, id, slot, className);
    }

    for (const layout of STATIC_BUTTONS) {
      this.mountButton(cluster, layout);
    }

    this.element.appendChild(cluster);
    container.appendChild(this.element);

    this.unsubscribers.push(
      EventBus.on('scene:changed', () => this.syncFromSave()),
      EventBus.on('demo:entered', () => this.syncFromSave()),
      EventBus.on('loadout:changed', () => this.syncFromSave()),
      EventBus.on('skill:cooldown-state', (state) => this.applySkillCooldowns(state)),
      EventBus.on('health:cooldown-state', (state) => this.applyHealthCooldown(state)),
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
        state.el.classList.remove('action-btn--pressed', 'action-btn--cooldown');
      }
    } else {
      this.syncFromSave();
    }
  }

  syncFromSave(): void {
    const save = gameStore.getState().save;
    this.element.classList.toggle('action-buttons--ancient', isAncientCombatActive());
    if (!save) return;

    for (const { id, slot } of SKILL_SLOTS) {
      const state = this.buttons.get(id);
      if (!state) continue;

      const skillId = save.equippedSkills[slot];
      const active = canCastEquippedSkill(save, slot);
      state.el.hidden = !active;
      if (!active) continue;

      const iconWrap = state.el.querySelector('.action-btn__icon-wrap');
      if (iconWrap) {
        iconWrap.innerHTML = renderSkillButtonHtml(skillId);
      }
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

  private mountSkillButton(
    parent: HTMLElement,
    id: ActionButtonId,
    slot: SkillSlotId,
    className: string,
  ): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action-btn action-btn--arc ${className}`;
    button.dataset.action = id;

    const iconWrap = document.createElement('span');
    iconWrap.className = 'action-btn__icon-wrap';

    const cooldown = document.createElement('span');
    cooldown.className = 'action-btn__cooldown';
    cooldown.setAttribute('aria-hidden', 'true');

    button.append(iconWrap, cooldown);
    this.wirePointer(button, id);

    this.buttons.set(id, {
      el: button,
      cooldownEl: cooldown,
      held: false,
      pressed: false,
      released: false,
      slot,
    });
    parent.appendChild(button);
  }

  private mountButton(parent: HTMLElement, layout: ButtonLayout): void {
    const button = document.createElement('button');
    button.type = 'button';
    const arcClass = layout.id === 'attack' ? '' : ' action-btn--arc';
    button.className = `action-btn${arcClass} ${layout.className}`;
    button.dataset.action = layout.id;
    button.setAttribute(
      'aria-label',
      layout.id === 'health' ? I18nManager.t('combat.health.aria') : layout.ariaLabel,
    );
    button.innerHTML = layout.iconHtml;
    this.wirePointer(button, layout.id);

    const cooldown = document.createElement('span');
    cooldown.className = 'action-btn__cooldown';
    cooldown.setAttribute('aria-hidden', 'true');
    if (layout.id !== 'health') {
      cooldown.hidden = true;
    }
    button.appendChild(cooldown);

    this.buttons.set(layout.id, {
      el: button,
      cooldownEl: cooldown,
      held: false,
      pressed: false,
      released: false,
      slot: layout.slot,
    });
    parent.appendChild(button);
  }

  private wirePointer(button: HTMLButtonElement, id: ActionButtonId): void {
    button.addEventListener('pointerdown', (event) => {
      if (!this.enabled) return;
      event.preventDefault();
      this.onPointerDown(id);
    });
    button.addEventListener('pointerup', () => this.onPointerUp(id));
    button.addEventListener('pointerleave', () => this.onPointerUp(id));
    button.addEventListener('pointercancel', () => this.onPointerUp(id));
  }

  private onPointerDown(id: ActionButtonId): void {
    if (!this.enabled) return;

    const state = this.buttons.get(id);
    if (!state || state.held) return;

    const slot = SLOT_BY_BUTTON[id];
    const onCooldown =
      state.cooldownEl.style.opacity !== '0' && state.el.classList.contains('action-btn--cooldown');
    if (onCooldown && (slot || id === 'health')) {
      return;
    }

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

  private applySkillCooldowns(state: {
    primary: { remainingMs: number; totalMs: number };
    secondary: { remainingMs: number; totalMs: number };
    ultimate: { remainingMs: number; totalMs: number };
  }): void {
    const map: Record<SkillSlotId, ActionButtonId> = {
      primary: 'skillPrimary',
      secondary: 'skillSecondary',
      ultimate: 'skillUltimate',
    };

    for (const slot of ['primary', 'secondary', 'ultimate'] as const) {
      const btnId = map[slot];
      const btn = this.buttons.get(btnId);
      if (!btn) continue;

      const { remainingMs, totalMs } = state[slot];
      const ready = cooldownReadyPct(remainingMs, totalMs);
      const onCd = remainingMs > 0;

      btn.el.classList.toggle('action-btn--cooldown', onCd);
      btn.cooldownEl.style.opacity = onCd ? '1' : '0';
      btn.cooldownEl.style.setProperty('--cd-deg', `${Math.floor(ready * 360)}deg`);
    }
  }

  private applyHealthCooldown(state: { remainingMs: number; totalMs: number }): void {
    const btn = this.buttons.get('health');
    if (!btn) return;

    const ready = cooldownReadyPct(state.remainingMs, state.totalMs);
    const onCd = state.remainingMs > 0;

    btn.el.classList.toggle('action-btn--cooldown', onCd);
    btn.cooldownEl.style.opacity = onCd ? '1' : '0';
    btn.cooldownEl.style.setProperty('--cd-deg', `${Math.floor(ready * 360)}deg`);
  }

  private tryHaptic(): void {
    try {
      navigator.vibrate?.(10);
    } catch {
      // Vibration API unavailable or blocked.
    }
  }
}
