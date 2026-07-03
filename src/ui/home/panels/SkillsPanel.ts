import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';
import { getInsightIntentConfig } from '@/progression/InsightDefinitions';
import {
  checkAwakeningReady,
  getInsightState,
  insightDisplayPct,
} from '@/progression/InsightSystem';
import { listDiscoveredIntentIds } from '@/progression/SkillLoadout';
import { showAwakeningModal } from '@/ui/modals/AwakeningModal';

const SIGNATURE_INTENT_ICONS: Record<string, string> = {
  sword: '⚔',
  void: '◈',
  flame: '🔥',
  lightning: '⚡',
  time: '⏳',
  life: '✦',
};

export interface SkillsPanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

export function createSkillsPanel(): SkillsPanelHandles {
  const root = document.createElement('div');
  root.className = 'home-panel home-skills';
  root.dataset.panel = 'skills';

  const title = document.createElement('h2');
  title.className = 'home-panel__title';
  title.textContent = I18nManager.t('home.nav.skills');

  const intro = document.createElement('p');
  intro.className = 'home-skills__intro';
  intro.textContent = I18nManager.t('home.skills.intro');

  const list = document.createElement('div');
  list.className = 'home-skills__list';

  const empty = document.createElement('p');
  empty.className = 'home-skills__empty';
  empty.hidden = true;
  empty.textContent = I18nManager.t('home.skills.empty');

  root.append(title, intro, list, empty);

  let ceremonyActive = false;

  const refresh = (): void => {
    const save = gameStore.getState().save;
    list.replaceChildren();

    const discovered = save ? listDiscoveredIntentIds(save) : [];
    empty.hidden = discovered.length > 0;

    for (const intentId of discovered) {
      const config = getInsightIntentConfig(intentId);
      const iconChar = SIGNATURE_INTENT_ICONS[intentId] ?? '✦';
      const state = save ? getInsightState(save, intentId) : null;
      const progress = state ? (state.awakened ? 100 : insightDisplayPct(state.xp)) : 0;
      const ready = save ? checkAwakeningReady(save, intentId) : false;

      const row = document.createElement('div');
      row.className = 'home-skills__row';
      row.dataset.testid = `home-skills-intent-${intentId}`;
      if (state?.awakened) row.classList.add('home-skills__row--awakened');
      if (ready) row.classList.add('home-skills__row--ready');

      const icon = document.createElement('div');
      icon.className = 'home-skills__icon';
      icon.textContent = iconChar;
      icon.setAttribute('aria-hidden', 'true');

      const info = document.createElement('div');
      info.className = 'home-skills__info';

      const name = document.createElement('p');
      name.className = 'home-skills__name';
      name.textContent = I18nManager.t(`${config.baseSkillId}.name`);
      if (state?.awakened) {
        name.textContent = I18nManager.t(`${config.awakenedSkillId}.name`);
      }

      const bar = document.createElement('div');
      bar.className = 'home-skills__bar';
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(progress));

      const fill = document.createElement('div');
      fill.className = 'home-skills__bar-fill';
      fill.style.width = `${progress}%`;
      bar.appendChild(fill);

      info.append(name, bar);

      if (ready) {
        const awakenBtn = document.createElement('button');
        awakenBtn.type = 'button';
        awakenBtn.className = 'home-skills__awaken';
        awakenBtn.textContent = I18nManager.t('home.skills.awaken');
        awakenBtn.addEventListener('click', () => {
          if (ceremonyActive) return;
          const uiRoot = document.getElementById('ui-root');
          if (!uiRoot) return;
          ceremonyActive = true;
          void showAwakeningModal(uiRoot, { intentId }).finally(() => {
            ceremonyActive = false;
            refresh();
          });
        });
        row.append(icon, info, awakenBtn);
      } else {
        row.append(icon, info);
      }

      list.appendChild(row);
    }
  };

  refresh();

  return { root, refresh, destroy: () => root.remove() };
}
