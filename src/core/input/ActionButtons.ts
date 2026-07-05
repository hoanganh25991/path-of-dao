import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';
import { isAncientCombatActive } from '@/progression/AncientCombatMode';
import { canCastEquippedSkill } from '@/progression/SkillLoadout';
import { cooldownReadyPct } from '@/progression/SkillCooldown';
import {
  SKILL_SLOT_INDICES,
  coerceEquippedSkills,
  skillActionId,
  skillSlotFromAction,
  type SkillActionId,
  type SkillCooldownState,
  type SkillSlotIndex,
} from '@/progression/SkillSlots';
import {
  isAwakenedSkillId,
  renderSkillButtonHtml,
  skillButtonAriaLabel,
} from '@/ui/skills/SkillIcon';

export type ActionButtonId =
  | 'attack'
  | 'dodge'
  | 'health'
  | SkillActionId;

export interface ActionButtonSnapshot {
  held: boolean;
  pressed: boolean;
  released: boolean;
}

const STATIC_BUTTONS = [
  {
    id: 'attack' as const,
    className: 'action-btn--attack',
    iconHtml: '<span class="skill-btn__icon skill-btn__icon--attack">⚔</span>',
    ariaLabel: 'Attack',
  },
  {
    id: 'health' as const,
    className: 'action-btn--health',
    iconHtml:
      '<span class="skill-btn__icon skill-btn__icon--health" style="--skill-color:#286848;--skill-glow:#80ffb0">✦</span>',
    ariaLabel: 'Gather Qi',
  },
  {
    id: 'dodge' as const,
    className: 'action-btn--dodge',
    iconHtml: '<span class="skill-btn__icon skill-btn__icon--dodge">💨</span>',
    ariaLabel: 'Dodge',
  },
];

const SKILL_BUTTONS = SKILL_SLOT_INDICES.map((slot) => ({
  id: skillActionId(slot),
  slot,
}));

const SKILL_ARC_RADIUS = 'var(--arc-radius-skill)';

/** Center of the outer skill quarter-circle (math coords: 0° = right, 90° = up). */
const SKILL_ARC_CENTER_DEG = 135;
const SKILL_ARC_MAX_DEG = 178;
const SKILL_ARC_MIN_DEG = 72;

/**
 * Place skill buttons on an arc with at least `--skill-arc-gap` between neighbors.
 * Reads `--arc-radius-skill`, `--btn-size`, and `--skill-arc-gap` from the cluster root.
 */
function layoutSkillArc(
  root: HTMLElement,
  count: number,
): { angles: number[]; minAngleDeg: number } {
  if (count <= 0) return { angles: [], minAngleDeg: 98 };

  const style = getComputedStyle(root);
  const radiusPx = parseFloat(style.getPropertyValue('--arc-radius-skill')) || 124;
  const btnSizePx = parseFloat(style.getPropertyValue('--btn-size')) || 52;
  const gapPx = parseFloat(style.getPropertyValue('--skill-arc-gap')) || 8;

  if (count === 1) {
    return { angles: [SKILL_ARC_CENTER_DEG], minAngleDeg: SKILL_ARC_CENTER_DEG };
  }

  const minChord = btnSizePx + gapPx;
  const stepDeg =
    (2 * Math.asin(Math.min(1, minChord / (2 * radiusPx))) * 180) / Math.PI;
  const spanDeg = stepDeg * (count - 1);

  let startDeg = SKILL_ARC_CENTER_DEG + spanDeg / 2;
  let endDeg = SKILL_ARC_CENTER_DEG - spanDeg / 2;

  if (startDeg > SKILL_ARC_MAX_DEG) {
    startDeg = SKILL_ARC_MAX_DEG;
    endDeg = startDeg - spanDeg;
  }
  if (endDeg < SKILL_ARC_MIN_DEG) {
    endDeg = SKILL_ARC_MIN_DEG;
    startDeg = endDeg + spanDeg;
  }

  const angles = Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    return startDeg - t * (startDeg - endDeg);
  });

  return { angles, minAngleDeg: endDeg };
}

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
      slot?: SkillSlotIndex;
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

    for (const { id, slot } of SKILL_BUTTONS) {
      this.mountSkillButton(cluster, id, slot);
    }

    for (const layout of STATIC_BUTTONS) {
      this.mountButton(cluster, layout);
    }

    this.element.appendChild(cluster);
    container.appendChild(this.element);

    this.unsubscribers.push(
      EventBus.on('scene:changed', () => this.syncFromSave()),
      EventBus.on('demo:entered', () => this.syncFromSave()),
      EventBus.on('demo:exited', () => this.syncFromSave()),
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

    const loadout = coerceEquippedSkills(save.equippedSkills);
    const active: Array<{ id: SkillActionId; slot: SkillSlotIndex; skillId: string }> = [];

    for (const { id, slot } of SKILL_BUTTONS) {
      const state = this.buttons.get(id);
      if (!state) continue;

      const skillId = loadout[slot];
      if (!canCastEquippedSkill(save, slot)) {
        state.el.hidden = true;
        state.el.style.removeProperty('--arc-angle');
        state.el.style.removeProperty('--arc-radius');
        continue;
      }

      active.push({ id, slot, skillId });
    }

    const arcLayout = layoutSkillArc(this.element, active.length);
    this.element.style.setProperty('--arc-skill-min-deg', `${arcLayout.minAngleDeg}deg`);

    for (let i = 0; i < active.length; i++) {
      const { id, skillId } = active[i]!;
      const state = this.buttons.get(id)!;
      const angle = arcLayout.angles[i]!;

      state.el.hidden = false;
      state.el.style.setProperty('--arc-radius', SKILL_ARC_RADIUS);
      state.el.style.setProperty('--arc-angle', `${angle}deg`);

      const iconWrap = state.el.querySelector('.action-btn__icon-wrap');
      if (iconWrap) {
        iconWrap.innerHTML = renderSkillButtonHtml(skillId);
      }
      state.el.setAttribute('aria-label', skillButtonAriaLabel(skillId));
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
    id: SkillActionId,
    slot: SkillSlotIndex,
  ): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-btn action-btn--arc action-btn--skill';
    button.dataset.action = id;
    button.hidden = true;

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

  private mountButton(
    parent: HTMLElement,
    layout: (typeof STATIC_BUTTONS)[number],
  ): void {
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

    const onCooldown =
      state.cooldownEl.style.opacity !== '0' && state.el.classList.contains('action-btn--cooldown');
    if (onCooldown && (id.startsWith('skill') || id === 'health')) {
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

  private applySkillCooldowns(state: SkillCooldownState): void {
    for (const slot of SKILL_SLOT_INDICES) {
      const btn = this.buttons.get(skillActionId(slot));
      if (!btn || btn.el.hidden) continue;

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

export function isSkillActionId(id: ActionButtonId): id is SkillActionId {
  return id.startsWith('skill');
}

export { skillSlotFromAction };
