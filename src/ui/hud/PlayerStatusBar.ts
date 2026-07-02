import { EventBus } from '@/core/EventBus';
import '@/ui/hud/player-status.css';

/** Top-left HP/Mana bars — updated via 'player:stats-changed' (07 §9). */
export class PlayerStatusBar {
  private static root: HTMLElement | null = null;
  private static hpFill: HTMLElement | null = null;
  private static manaFill: HTMLElement | null = null;
  private static hpText: HTMLElement | null = null;
  private static manaText: HTMLElement | null = null;
  private static unsubscribe: (() => void) | null = null;

  static init(parent: HTMLElement): void {
    if (PlayerStatusBar.root) return;

    const root = document.createElement('div');
    root.className = 'player-status';
    root.innerHTML = `
      <div class="status-bar status-bar--hp">
        <div class="status-bar__fill"></div>
        <span class="status-bar__text"></span>
      </div>
      <div class="status-bar status-bar--mana">
        <div class="status-bar__fill"></div>
        <span class="status-bar__text"></span>
      </div>
    `;
    parent.appendChild(root);

    PlayerStatusBar.root = root;
    PlayerStatusBar.hpFill = root.querySelector('.status-bar--hp .status-bar__fill');
    PlayerStatusBar.hpText = root.querySelector('.status-bar--hp .status-bar__text');
    PlayerStatusBar.manaFill = root.querySelector('.status-bar--mana .status-bar__fill');
    PlayerStatusBar.manaText = root.querySelector('.status-bar--mana .status-bar__text');

    PlayerStatusBar.unsubscribe = EventBus.on('player:stats-changed', (stats) => {
      PlayerStatusBar.render(stats);
    });
  }

  static destroy(): void {
    PlayerStatusBar.unsubscribe?.();
    PlayerStatusBar.unsubscribe = null;
    PlayerStatusBar.root?.remove();
    PlayerStatusBar.root = null;
    PlayerStatusBar.hpFill = null;
    PlayerStatusBar.manaFill = null;
    PlayerStatusBar.hpText = null;
    PlayerStatusBar.manaText = null;
  }

  private static render(stats: { hp: number; hpMax: number; mana: number; manaMax: number }): void {
    if (PlayerStatusBar.hpFill) {
      const pct = stats.hpMax > 0 ? (stats.hp / stats.hpMax) * 100 : 0;
      PlayerStatusBar.hpFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    }
    if (PlayerStatusBar.hpText) {
      PlayerStatusBar.hpText.textContent = `${Math.ceil(stats.hp)} / ${Math.ceil(stats.hpMax)}`;
    }
    if (PlayerStatusBar.manaFill) {
      const pct = stats.manaMax > 0 ? (stats.mana / stats.manaMax) * 100 : 0;
      PlayerStatusBar.manaFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    }
    if (PlayerStatusBar.manaText) {
      PlayerStatusBar.manaText.textContent = `${Math.ceil(stats.mana)} / ${Math.ceil(stats.manaMax)}`;
    }
  }
}
