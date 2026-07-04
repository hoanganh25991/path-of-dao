import '@/ui/hud/combat-pause.css';
import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { InputManager } from '@/core/input/InputManager';

function isDeathOverlayOpen(): boolean {
  return Boolean(
    document.querySelector('[data-testid="combat-death-overlay"].combat-pause-menu--active'),
  );
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'home-toast home-ui__interactive';
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.addEventListener('animationend', () => toast.remove());
}

/** Combat pause overlay — save, resume, return home. */
export class CombatPauseMenu {
  private static mounted = false;
  private static menuOpen = false;
  private static pauseBtn: HTMLButtonElement | null = null;
  private static overlay: HTMLElement | null = null;
  private static unsubscribeScene: (() => void) | null = null;

  static init(parent: HTMLElement): void {
    if (CombatPauseMenu.mounted) return;

    const overlay = document.createElement('div');
    overlay.className = 'combat-pause-menu';
    overlay.dataset.testid = 'combat-pause-menu';

    const backdrop = document.createElement('div');
    backdrop.className = 'combat-pause-menu__backdrop';

    const card = document.createElement('div');
    card.className = 'combat-pause-menu__card';

    const title = document.createElement('h2');
    title.className = 'combat-pause-menu__title';
    title.textContent = I18nManager.t('combat.pause.title');

    const actions = document.createElement('div');
    actions.className = 'combat-pause-menu__actions';

    const resumeBtn = document.createElement('button');
    resumeBtn.type = 'button';
    resumeBtn.className = 'combat-pause-menu__btn combat-pause-menu__btn--primary';
    resumeBtn.textContent = I18nManager.t('combat.pause.resume');
    resumeBtn.addEventListener('click', () => CombatPauseMenu.close());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'combat-pause-menu__btn';
    saveBtn.textContent = I18nManager.t('combat.pause.save');
    saveBtn.addEventListener('click', () => {
      EventBus.emit('combat:request-save', undefined);
      showToast(I18nManager.t('system.save.success'));
    });

    const homeBtn = document.createElement('button');
    homeBtn.type = 'button';
    homeBtn.className = 'combat-pause-menu__btn combat-pause-menu__btn--danger';
    homeBtn.textContent = I18nManager.t('combat.pause.return_home');
    homeBtn.addEventListener('click', () => {
      CombatPauseMenu.close();
      EventBus.emit('combat:request-exit', { wavesCleared: false });
    });

    actions.append(resumeBtn, saveBtn, homeBtn);
    card.append(title, actions);
    overlay.append(backdrop, card);
    parent.appendChild(overlay);
    CombatPauseMenu.overlay = overlay;

    backdrop.addEventListener('click', () => CombatPauseMenu.close());

    CombatPauseMenu.unsubscribeScene = EventBus.on('scene:changed', ({ id }) => {
      if (id !== 'combat') CombatPauseMenu.close();
    });

    CombatPauseMenu.mounted = true;
  }

  /** Mount pause control into the top-right HUD (TopRightHud). */
  static mountPauseButton(container: HTMLElement): void {
    if (CombatPauseMenu.pauseBtn) return;

    const pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.className = 'combat-pause-btn';
    pauseBtn.dataset.testid = 'combat-pause-btn';
    pauseBtn.setAttribute('aria-label', I18nManager.t('combat.pause.open'));
    pauseBtn.textContent = '⏸';
    pauseBtn.addEventListener('click', () => CombatPauseMenu.show());
    container.appendChild(pauseBtn);
    CombatPauseMenu.pauseBtn = pauseBtn;
  }

  static unmountPauseButton(): void {
    CombatPauseMenu.pauseBtn?.remove();
    CombatPauseMenu.pauseBtn = null;
  }

  static destroy(): void {
    CombatPauseMenu.unsubscribeScene?.();
    CombatPauseMenu.unsubscribeScene = null;
    CombatPauseMenu.close();
    CombatPauseMenu.unmountPauseButton();
    CombatPauseMenu.overlay?.remove();
    CombatPauseMenu.overlay = null;
    CombatPauseMenu.mounted = false;
  }

  static isOpen(): boolean {
    return CombatPauseMenu.menuOpen;
  }

  static show(): void {
    if (CombatPauseMenu.menuOpen || isDeathOverlayOpen() || !CombatPauseMenu.overlay) return;
    CombatPauseMenu.menuOpen = true;
    CombatPauseMenu.overlay.classList.add('combat-pause-menu--active');
    EventBus.emit('combat:pause-changed', { paused: true });
    InputManager.setEnabled(false);
  }

  static close(): void {
    if (!CombatPauseMenu.menuOpen || !CombatPauseMenu.overlay) return;
    CombatPauseMenu.menuOpen = false;
    CombatPauseMenu.overlay.classList.remove('combat-pause-menu--active');
    EventBus.emit('combat:pause-changed', { paused: false });
    if (CombatPauseMenu.isCombatScene() && !isDeathOverlayOpen()) {
      InputManager.setEnabled(true);
    }
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    CombatPauseMenu.destroy();
  }

  private static isCombatScene(): boolean {
    return Boolean(
      document.querySelector('.top-right-hud__pause-slot--visible [data-testid="combat-pause-btn"]'),
    );
  }
}
