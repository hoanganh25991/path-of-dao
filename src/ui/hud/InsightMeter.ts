import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import {
  checkAwakeningReady,
  getInsightState,
  insightDisplayPct,
} from '@/progression/InsightSystem';
import { getSkillDefinition } from '@/progression/SkillLoader';
import '@/ui/hud/insight-meter.css';

const INTENT_ICONS: Record<string, string> = {
  sword: '⚔',
  void: '◈',
  flame: '🔥',
  lightning: '⚡',
  time: '⏳',
  life: '✦',
};

/** Thin intent progress bar below mana — tracks primary equipped skill (sub-plan 14 §8). */
export class InsightMeter {
  private static root: HTMLElement | null = null;
  private static fill: HTMLElement | null = null;
  private static icon: HTMLElement | null = null;
  private static unsubXp: (() => void) | null = null;
  private static unsubReady: (() => void) | null = null;
  private static unsubStore: (() => void) | null = null;

  static init(parent: HTMLElement): void {
    if (InsightMeter.root) return;

    const root = document.createElement('div');
    root.className = 'insight-meter';
    root.dataset.testid = 'insight-meter';

    const icon = document.createElement('span');
    icon.className = 'insight-meter__icon';
    icon.setAttribute('aria-hidden', 'true');

    const bar = document.createElement('div');
    bar.className = 'insight-meter__bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');

    const fill = document.createElement('div');
    fill.className = 'insight-meter__fill';
    bar.appendChild(fill);

    root.append(icon, bar);
    parent.appendChild(root);

    InsightMeter.root = root;
    InsightMeter.fill = fill;
    InsightMeter.icon = icon;

    InsightMeter.unsubXp = EventBus.on('insight:xp-changed', () => InsightMeter.render());
    InsightMeter.unsubReady = EventBus.on('insight:ready-to-awaken', () => InsightMeter.render());
    InsightMeter.unsubStore = gameStore.subscribe(() => InsightMeter.render());

    InsightMeter.render();
  }

  static destroy(): void {
    InsightMeter.unsubXp?.();
    InsightMeter.unsubXp = null;
    InsightMeter.unsubReady?.();
    InsightMeter.unsubReady = null;
    InsightMeter.unsubStore?.();
    InsightMeter.unsubStore = null;
    InsightMeter.root?.remove();
    InsightMeter.root = null;
    InsightMeter.fill = null;
    InsightMeter.icon = null;
  }

  private static render(): void {
    const save = gameStore.getState().save;
    if (!InsightMeter.root || !InsightMeter.fill || !InsightMeter.icon || !save) return;

    const skillId = save.equippedSkills.primary;
    let intent = 'void';
    try {
      intent = getSkillDefinition(skillId).intent;
    } catch {
      /* keep default */
    }

    const state = getInsightState(save, intent);
    const pct = state.awakened ? 100 : insightDisplayPct(state.xp);
    const ready = !state.awakened && checkAwakeningReady(save, intent);

    InsightMeter.icon.textContent = INTENT_ICONS[intent] ?? '◈';
    InsightMeter.fill.style.width = `${pct}%`;
    InsightMeter.root.dataset.intent = intent;
    InsightMeter.root.classList.toggle('insight-meter--ready', ready);
    InsightMeter.root.classList.toggle('insight-meter--awakened', state.awakened);
    InsightMeter.root.setAttribute('aria-valuenow', String(pct));
  }
}
