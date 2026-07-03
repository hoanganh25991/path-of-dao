import { I18nManager } from '@/core/i18n/I18nManager';
import type { HomeTab } from '@/ui/home/types';

export interface BottomNavHandles {
  root: HTMLElement;
  setActive(tab: HomeTab | null): void;
  destroy(): void;
}

export function createBottomNav(onSelect: (tab: HomeTab) => void): BottomNavHandles {
  const root = document.createElement('nav');
  root.className = 'home-bottom-nav home-ui__interactive';
  root.setAttribute('role', 'tablist');
  root.setAttribute('aria-label', 'Home navigation');

  const tabs: { id: HomeTab; labelKey: string }[] = [
    { id: 'play', labelKey: 'home.nav.play' },
    { id: 'echoes', labelKey: 'home.nav.echoes' },
    { id: 'inventory', labelKey: 'home.nav.inventory' },
    { id: 'skills', labelKey: 'home.nav.skills' },
    { id: 'story', labelKey: 'home.nav.story' },
  ];

  const buttons = tabs.map(({ id, labelKey }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'home-bottom-nav__tab';
    button.dataset.tab = id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('aria-label', I18nManager.t(labelKey));
    button.textContent = I18nManager.t(labelKey);

    button.addEventListener('click', () => onSelect(id));
    root.appendChild(button);
    return button;
  });

  return {
    root,
    setActive(tab: HomeTab | null) {
      for (const button of buttons) {
        const active = tab !== null && button.dataset.tab === tab;
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      }
    },
    destroy() {
      root.remove();
    },
  };
}
