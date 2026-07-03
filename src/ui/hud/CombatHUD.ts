import type { SceneId } from '@/app/SceneId';
import { EventBus } from '@/core/EventBus';
import { InputManager } from '@/core/input/InputManager';
import { PlayerStatusBar } from '@/ui/hud/PlayerStatusBar';
import { InsightMeter } from '@/ui/hud/InsightMeter';
import '@/ui/hud/combat-hud.css';

/** Mounts combat input widgets when the active scene is combat. */
export class CombatHUD {
  private static mounted = false;
  private static root: HTMLElement | null = null;
  private static unsubscribe: (() => void) | null = null;

  static init(uiRoot: HTMLElement): void {
    if (CombatHUD.mounted) return;

    CombatHUD.root = document.createElement('div');
    CombatHUD.root.className = 'combat-hud';
    CombatHUD.root.hidden = true;
    uiRoot.appendChild(CombatHUD.root);

    InputManager.mount(CombatHUD.root);
    PlayerStatusBar.init(CombatHUD.root);
    InsightMeter.init(CombatHUD.root);

    CombatHUD.unsubscribe = EventBus.on('scene:changed', ({ id }) => {
      CombatHUD.applyScene(id);
    });

    CombatHUD.mounted = true;
  }

  static destroy(): void {
    CombatHUD.unsubscribe?.();
    CombatHUD.unsubscribe = null;
    PlayerStatusBar.destroy();
    InsightMeter.destroy();
    InputManager.destroy();
    CombatHUD.root?.remove();
    CombatHUD.root = null;
    CombatHUD.mounted = false;
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    CombatHUD.destroy();
  }

  private static applyScene(id: SceneId): void {
    if (!CombatHUD.root) return;

    const showCombat = id === 'combat';
    CombatHUD.root.hidden = !showCombat;
    InputManager.setEnabled(showCombat);
  }
}
