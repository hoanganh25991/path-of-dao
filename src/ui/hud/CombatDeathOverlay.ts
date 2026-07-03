import '@/ui/hud/combat-pause.css';
import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { InputManager } from '@/core/input/InputManager';
import { isAncientCombatActive } from '@/progression/AncientCombatMode';
import { CombatPauseMenu } from '@/ui/hud/CombatPauseMenu';

/** Shown when the player falls in combat — retry wave or retreat home. */
export class CombatDeathOverlay {
  private static mounted = false;
  private static overlayOpen = false;
  private static overlay: HTMLElement | null = null;
  private static unsubscribers: Array<() => void> = [];

  static init(parent: HTMLElement): void {
    if (CombatDeathOverlay.mounted) return;

    const overlay = document.createElement('div');
    overlay.className = 'combat-pause-menu combat-death-overlay';
    overlay.dataset.testid = 'combat-death-overlay';

    const backdrop = document.createElement('div');
    backdrop.className = 'combat-pause-menu__backdrop';

    const card = document.createElement('div');
    card.className = 'combat-pause-menu__card';

    const title = document.createElement('h2');
    title.className = 'combat-pause-menu__title';
    title.textContent = I18nManager.t('combat.death.title');

    const flavor = document.createElement('p');
    flavor.className = 'combat-death-overlay__flavor';
    flavor.textContent = I18nManager.t('combat.death.flavor');

    const actions = document.createElement('div');
    actions.className = 'combat-pause-menu__actions';

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'combat-pause-menu__btn combat-pause-menu__btn--primary';
    retryBtn.textContent = I18nManager.t('combat.death.retry');
    retryBtn.addEventListener('click', () => {
      CombatDeathOverlay.close();
      EventBus.emit('combat:request-retry', undefined);
    });

    const homeBtn = document.createElement('button');
    homeBtn.type = 'button';
    homeBtn.className = 'combat-pause-menu__btn combat-pause-menu__btn--danger';
    homeBtn.textContent = I18nManager.t('combat.death.return_home');
    homeBtn.addEventListener('click', () => {
      CombatDeathOverlay.close();
      EventBus.emit('combat:request-exit', { wavesCleared: false });
    });

    actions.append(retryBtn, homeBtn);
    card.append(title, flavor, actions);
    overlay.append(backdrop, card);
    parent.appendChild(overlay);
    CombatDeathOverlay.overlay = overlay;

    CombatDeathOverlay.unsubscribers.push(
      EventBus.on('player:died', () => {
        if (isAncientCombatActive()) return;
        CombatPauseMenu.close();
        CombatDeathOverlay.show();
      }),
      EventBus.on('scene:changed', ({ id }) => {
        if (id !== 'combat') CombatDeathOverlay.close();
      }),
    );

    CombatDeathOverlay.mounted = true;
  }

  static destroy(): void {
    for (const off of CombatDeathOverlay.unsubscribers) off();
    CombatDeathOverlay.unsubscribers = [];
    CombatDeathOverlay.close();
    CombatDeathOverlay.overlay?.remove();
    CombatDeathOverlay.overlay = null;
    CombatDeathOverlay.mounted = false;
  }

  static isOpen(): boolean {
    return CombatDeathOverlay.overlayOpen;
  }

  static show(): void {
    if (CombatDeathOverlay.overlayOpen || !CombatDeathOverlay.overlay) return;
    CombatDeathOverlay.overlayOpen = true;
    CombatDeathOverlay.overlay.classList.add('combat-pause-menu--active');
    EventBus.emit('combat:pause-changed', { paused: true });
    InputManager.setEnabled(false);
  }

  static close(): void {
    if (!CombatDeathOverlay.overlayOpen || !CombatDeathOverlay.overlay) return;
    CombatDeathOverlay.overlayOpen = false;
    CombatDeathOverlay.overlay.classList.remove('combat-pause-menu--active');
    EventBus.emit('combat:pause-changed', { paused: false });
    if (!CombatPauseMenu.isOpen() && CombatDeathOverlay.isCombatActive()) {
      InputManager.setEnabled(true);
    }
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    CombatDeathOverlay.destroy();
  }

  private static isCombatActive(): boolean {
    return CombatDeathOverlay.overlay?.closest('.combat-hud')?.hasAttribute('hidden') === false;
  }
}
