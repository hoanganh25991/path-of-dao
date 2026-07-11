import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { realmTierLabelKey } from '@/progression/CultivationDisplay';
import '@/ui/hud/cultivation-toast.css';

/** Combat toast when cultivation level advances (realm sub-tier messaging). */
export class CultivationToast {
  private static unsubscribers: Array<() => void> = [];
  private static mounted = false;
  private static active: HTMLElement | null = null;

  static init(): void {
    if (CultivationToast.mounted) return;

    CultivationToast.unsubscribers.push(
      EventBus.on('progression:level-up', ({ realmId, tier }) => {
        const realmLabel = I18nManager.t(realmTierLabelKey(realmId, tier));
        CultivationToast.show(I18nManager.t('progression.level_up', { realm: realmLabel }));
      }),
    );

    CultivationToast.mounted = true;
  }

  static destroy(): void {
    for (const unsub of CultivationToast.unsubscribers) unsub();
    CultivationToast.unsubscribers = [];
    CultivationToast.mounted = false;
    CultivationToast.dismiss();
  }

  private static dismiss(): void {
    CultivationToast.active?.remove();
    CultivationToast.active = null;
  }

  private static show(message: string): void {
    CultivationToast.dismiss();

    const toast = document.createElement('div');
    toast.className = 'cultivation-toast';
    toast.dataset.testid = 'cultivation-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    CultivationToast.active = toast;

    toast.addEventListener('animationend', () => {
      if (CultivationToast.active === toast) {
        CultivationToast.dismiss();
      }
    });
  }
}
