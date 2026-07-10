import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import '@/ui/hud/combat-map-title.css';

/** Top-center map label while exploring combat maps. */
export class CombatMapTitle {
  private static root: HTMLElement | null = null;
  private static nameEl: HTMLElement | null = null;
  private static displayNameKey: string | null = null;
  private static unsubscribe: Array<() => void> = [];

  static init(parent: HTMLElement): void {
    if (CombatMapTitle.root) return;

    const root = document.createElement('div');
    root.className = 'combat-map-title';
    root.hidden = true;
    root.dataset.testid = 'combat-map-title';

    const nameEl = document.createElement('p');
    nameEl.className = 'combat-map-title__name';

    root.appendChild(nameEl);
    parent.appendChild(root);

    CombatMapTitle.root = root;
    CombatMapTitle.nameEl = nameEl;

    CombatMapTitle.unsubscribe.push(
      EventBus.on('combat:map-loaded', ({ displayNameKey }) => {
        CombatMapTitle.displayNameKey = displayNameKey;
        CombatMapTitle.render();
      }),
      EventBus.on('settings:locale-changed', () => {
        CombatMapTitle.render();
      }),
      EventBus.on('scene:changed', ({ id }) => {
        if (id !== 'combat') {
          CombatMapTitle.clear();
        }
      }),
    );
  }

  static destroy(): void {
    for (const unsub of CombatMapTitle.unsubscribe) unsub();
    CombatMapTitle.unsubscribe = [];
    CombatMapTitle.root?.remove();
    CombatMapTitle.root = null;
    CombatMapTitle.nameEl = null;
    CombatMapTitle.displayNameKey = null;
  }

  private static clear(): void {
    CombatMapTitle.displayNameKey = null;
    if (CombatMapTitle.root) CombatMapTitle.root.hidden = true;
  }

  private static render(): void {
    if (!CombatMapTitle.root || !CombatMapTitle.nameEl) return;

    if (!CombatMapTitle.displayNameKey) {
      CombatMapTitle.root.hidden = true;
      return;
    }

    CombatMapTitle.root.hidden = false;
    CombatMapTitle.nameEl.textContent = I18nManager.t(CombatMapTitle.displayNameKey);
  }
}
