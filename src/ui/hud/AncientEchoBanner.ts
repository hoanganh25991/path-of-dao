import { I18nManager } from '@/core/i18n/I18nManager';
import { getActiveAncientId, getAncientProfile } from '@/progression/AncientDemoManager';
import '@/ui/hud/ancient-echo-banner.css';

/** Combat HUD banner — ancient name + epithet while walking an echo. */
export class AncientEchoBanner {
  private static root: HTMLElement | null = null;

  static init(parent: HTMLElement): void {
    if (AncientEchoBanner.root) return;

    const root = document.createElement('div');
    root.className = 'ancient-echo-banner';
    root.hidden = true;
    root.dataset.testid = 'ancient-echo-banner';
    parent.appendChild(root);
    AncientEchoBanner.root = root;
  }

  static destroy(): void {
    AncientEchoBanner.root?.remove();
    AncientEchoBanner.root = null;
  }

  static syncVisible(combatActive: boolean): void {
    if (!AncientEchoBanner.root) return;

    const ancientId = getActiveAncientId();
    if (!combatActive || !ancientId) {
      AncientEchoBanner.root.hidden = true;
      return;
    }

    const profile = getAncientProfile(ancientId);
    AncientEchoBanner.root.hidden = false;
    AncientEchoBanner.root.innerHTML = `
      <p class="ancient-echo-banner__epithet">${I18nManager.t(profile.epithetKey)}</p>
      <p class="ancient-echo-banner__name">${I18nManager.t(profile.nameKey)}</p>
      <p class="ancient-echo-banner__tag">${I18nManager.t('demo.combat.tag')}</p>
    `;
  }
}
