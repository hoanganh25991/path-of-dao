import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';

const SIGNATURE_SKILLS = [
  { id: 'skill.sword.slash', icon: '⚔' },
  { id: 'skill.void.slash', icon: '◈' },
  { id: 'skill.flame.bolt', icon: '🔥' },
  { id: 'skill.lightning.strike', icon: '⚡' },
  { id: 'skill.time.slow', icon: '⏳' },
  { id: 'skill.life.mend', icon: '✦' },
] as const;

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

  const list = document.createElement('div');
  list.className = 'home-skills__list';

  root.append(title, list);

  const refresh = (): void => {
    const save = gameStore.getState().save;
    list.replaceChildren();

    for (const skill of SIGNATURE_SKILLS) {
      const insight = save?.insights[skill.id];
      const progress = insight ? Math.min(100, insight.xp) : 0;

      const row = document.createElement('div');
      row.className = 'home-skills__row';

      const icon = document.createElement('div');
      icon.className = 'home-skills__icon';
      icon.textContent = skill.icon;
      icon.setAttribute('aria-hidden', 'true');

      const info = document.createElement('div');
      info.className = 'home-skills__info';

      const name = document.createElement('p');
      name.className = 'home-skills__name';
      name.textContent = I18nManager.t(`${skill.id}.name`);

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
      row.append(icon, info);
      list.appendChild(row);
    }
  };

  refresh();

  return { root, refresh, destroy: () => root.remove() };
}
