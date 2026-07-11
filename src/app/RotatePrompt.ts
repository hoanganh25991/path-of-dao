import { I18nManager } from '@/core/i18n/I18nManager';
import '@/ui/styles/rotate-prompt.css';

const OVERLAY_ID = 'rotate-prompt';

/** Full-screen “rotate to landscape” gate for portrait phones. */
export class RotatePrompt {
  private static el: HTMLElement | null = null;

  static mount(root: HTMLElement): void {
    if (RotatePrompt.el) return;

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'rotate-prompt';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.dataset.testid = 'rotate-prompt';
    overlay.innerHTML = `
      <div class="rotate-prompt__icon" aria-hidden="true">
        <span class="rotate-prompt__phone"></span>
        <span class="rotate-prompt__arrow"></span>
      </div>
      <p class="rotate-prompt__title"></p>
      <p class="rotate-prompt__hint"></p>
    `;

    root.append(overlay);
    RotatePrompt.el = overlay;
    RotatePrompt.refreshCopy();
  }

  static destroy(): void {
    RotatePrompt.el?.remove();
    RotatePrompt.el = null;
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    RotatePrompt.destroy();
  }

  static setVisible(visible: boolean): void {
    const el = RotatePrompt.el;
    if (!el) return;
    el.hidden = !visible;
    el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if (visible) RotatePrompt.refreshCopy();
  }

  static isVisible(): boolean {
    return Boolean(RotatePrompt.el && !RotatePrompt.el.hidden);
  }

  static refreshCopy(): void {
    const el = RotatePrompt.el;
    if (!el) return;
    const title = el.querySelector('.rotate-prompt__title');
    const hint = el.querySelector('.rotate-prompt__hint');
    if (title) title.textContent = I18nManager.t('system.orientation.rotate');
    if (hint) hint.textContent = I18nManager.t('system.orientation.rotate_hint');
    el.setAttribute('aria-label', I18nManager.t('system.orientation.rotate'));
  }
}
