import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { isAncientCombatActive } from '@/progression/AncientCombatMode';
import { getCultivationExpView } from '@/progression/CultivationDisplay';
import '@/ui/hud/player-status.css';

const STATUS_ICONS = {
  hp: '♥',
  mana: '✦',
  exp: '☸',
} as const;

type CombatStats = { hp: number; hpMax: number; mana: number; manaMax: number };

/** Top-left HP / Mana / Cultivation XP bars — updated via combat + store events. */
export class PlayerStatusBar {
  private static root: HTMLElement | null = null;
  private static hpFill: HTMLElement | null = null;
  private static manaFill: HTMLElement | null = null;
  private static expFill: HTMLElement | null = null;
  private static hpText: HTMLElement | null = null;
  private static manaText: HTMLElement | null = null;
  private static expText: HTMLElement | null = null;
  private static expRow: HTMLElement | null = null;
  private static ancientMode = false;
  private static lastStats: CombatStats | null = null;
  private static unsubscribers: Array<() => void> = [];

  static init(parent: HTMLElement): void {
    if (PlayerStatusBar.root) return;

    const root = document.createElement('div');
    root.className = 'player-status';
    root.innerHTML = `
      <div class="status-bar-row status-bar-row--hp">
        <span class="status-bar__icon status-bar__icon--hp" aria-hidden="true">${STATUS_ICONS.hp}</span>
        <div class="status-bar status-bar--hp">
          <div class="status-bar__fill"></div>
          <span class="status-bar__text"></span>
        </div>
      </div>
      <div class="status-bar-row status-bar-row--mana">
        <span class="status-bar__icon status-bar__icon--mana" aria-hidden="true">${STATUS_ICONS.mana}</span>
        <div class="status-bar status-bar--mana">
          <div class="status-bar__fill"></div>
          <span class="status-bar__text"></span>
        </div>
      </div>
      <div class="status-bar-row status-bar-row--exp" data-testid="cultivation-meter">
        <span class="status-bar__icon status-bar__icon--exp" aria-hidden="true">${STATUS_ICONS.exp}</span>
        <div class="status-bar status-bar--exp" role="progressbar" aria-valuemin="0" aria-valuemax="100">
          <div class="status-bar__fill"></div>
          <span class="status-bar__text"></span>
        </div>
      </div>
    `;
    parent.appendChild(root);

    PlayerStatusBar.root = root;
    PlayerStatusBar.hpFill = root.querySelector('.status-bar--hp .status-bar__fill');
    PlayerStatusBar.hpText = root.querySelector('.status-bar--hp .status-bar__text');
    PlayerStatusBar.manaFill = root.querySelector('.status-bar--mana .status-bar__fill');
    PlayerStatusBar.manaText = root.querySelector('.status-bar--mana .status-bar__text');
    PlayerStatusBar.expFill = root.querySelector('.status-bar--exp .status-bar__fill');
    PlayerStatusBar.expText = root.querySelector('.status-bar--exp .status-bar__text');
    PlayerStatusBar.expRow = root.querySelector('.status-bar-row--exp');

    PlayerStatusBar.unsubscribers.push(
      EventBus.on('player:stats-changed', (stats) => {
        PlayerStatusBar.lastStats = stats;
        PlayerStatusBar.renderCombat(stats);
      }),
      EventBus.on('progression:xp-gained', () => PlayerStatusBar.renderExp()),
      EventBus.on('progression:level-up', () => PlayerStatusBar.renderExp()),
      gameStore.subscribe((state, prev) => {
        if (state.save?.xp !== prev.save?.xp || state.save?.stats.level !== prev.save?.stats.level) {
          PlayerStatusBar.renderExp();
        }
      }),
    );

    PlayerStatusBar.renderExp();
  }

  static destroy(): void {
    for (const unsub of PlayerStatusBar.unsubscribers) unsub();
    PlayerStatusBar.unsubscribers = [];
    PlayerStatusBar.root?.remove();
    PlayerStatusBar.root = null;
    PlayerStatusBar.hpFill = null;
    PlayerStatusBar.manaFill = null;
    PlayerStatusBar.expFill = null;
    PlayerStatusBar.hpText = null;
    PlayerStatusBar.manaText = null;
    PlayerStatusBar.expText = null;
    PlayerStatusBar.expRow = null;
    PlayerStatusBar.lastStats = null;
    PlayerStatusBar.ancientMode = false;
  }

  static setAncientMode(enabled: boolean): void {
    PlayerStatusBar.ancientMode = enabled;
    PlayerStatusBar.root?.classList.toggle('player-status--ancient', enabled);
    if (PlayerStatusBar.lastStats) {
      PlayerStatusBar.renderCombat(PlayerStatusBar.lastStats);
    }
    PlayerStatusBar.renderExp();
  }

  private static isAncient(): boolean {
    return PlayerStatusBar.ancientMode || isAncientCombatActive();
  }

  private static renderCombat(stats: CombatStats): void {
    const ancient = PlayerStatusBar.isAncient();
    const hp = ancient ? stats.hpMax : stats.hp;
    const mana = ancient ? stats.manaMax : stats.mana;

    if (PlayerStatusBar.hpFill) {
      const pct = stats.hpMax > 0 ? (hp / stats.hpMax) * 100 : 100;
      PlayerStatusBar.hpFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    }
    if (PlayerStatusBar.hpText) {
      if (ancient) {
        PlayerStatusBar.hpText.textContent = '∞';
      } else {
        const hpStr = Math.ceil(stats.hp).toLocaleString();
        const maxStr = Math.ceil(stats.hpMax).toLocaleString();
        PlayerStatusBar.hpText.textContent = `${hpStr} / ${maxStr}`;
      }
    }
    if (PlayerStatusBar.manaFill) {
      const pct = stats.manaMax > 0 ? (mana / stats.manaMax) * 100 : 100;
      PlayerStatusBar.manaFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    }
    if (PlayerStatusBar.manaText) {
      if (ancient) {
        PlayerStatusBar.manaText.textContent = '∞';
      } else {
        const manaStr = Math.ceil(stats.mana).toLocaleString();
        const maxStr = Math.ceil(stats.manaMax).toLocaleString();
        PlayerStatusBar.manaText.textContent = `${manaStr} / ${maxStr}`;
      }
    }
  }

  private static renderExp(): void {
    const save = gameStore.getState().save;
    if (
      !save ||
      !PlayerStatusBar.expFill ||
      !PlayerStatusBar.expText ||
      !PlayerStatusBar.expRow
    ) {
      return;
    }

    const ancient = PlayerStatusBar.isAncient();
    const view = getCultivationExpView(save.xp);

    PlayerStatusBar.expRow.classList.remove('status-bar-row--ready', 'status-bar-row--awakened');

    if (ancient) {
      PlayerStatusBar.expFill.style.width = '100%';
      PlayerStatusBar.expText.textContent = '∞';
    } else if (view.atMaxLevel) {
      PlayerStatusBar.expFill.style.width = '100%';
      PlayerStatusBar.expText.textContent = `Lv.${view.level}`;
    } else {
      PlayerStatusBar.expFill.style.width = `${view.pct}%`;
      const xpStr = Math.ceil(view.xpIntoLevel).toLocaleString();
      const maxStr = view.xpToNext.toLocaleString();
      PlayerStatusBar.expText.textContent = `Lv.${view.level} · ${xpStr}/${maxStr}`;
    }

    PlayerStatusBar.expRow.setAttribute('aria-valuenow', String(view.pct));
  }
}
