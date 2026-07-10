import type { SceneId } from '@/app/SceneId';
import { EventBus } from '@/core/EventBus';
import { InputManager } from '@/core/input/InputManager';
import { isAncientCombatActive } from '@/progression/AncientCombatMode';
import { AncientEchoBanner } from '@/ui/hud/AncientEchoBanner';
import { PlayerStatusBar } from '@/ui/hud/PlayerStatusBar';
import { CombatSkillPicker } from '@/ui/hud/CombatSkillPicker';
import { CombatPauseMenu } from '@/ui/hud/CombatPauseMenu';
import { CombatDeathOverlay } from '@/ui/hud/CombatDeathOverlay';
import '@/ui/hud/combat-hud.css';
import { CultivationToast } from '@/ui/hud/CultivationToast';
import { CombatLootHint } from '@/ui/hud/CombatLootHint';

/** Mounts combat input widgets when the active scene is combat. */
export class CombatHUD {
  private static mounted = false;
  private static root: HTMLElement | null = null;
  private static unsubscribe: (() => void) | null = null;
  private static unsubscribeDemo: Array<() => void> = [];

  static init(uiRoot: HTMLElement): void {
    if (CombatHUD.mounted) return;

    CombatHUD.root = document.createElement('div');
    CombatHUD.root.className = 'combat-hud';
    CombatHUD.root.hidden = true;
    uiRoot.appendChild(CombatHUD.root);

    InputManager.mount(CombatHUD.root);
    PlayerStatusBar.init(CombatHUD.root);
    CombatLootHint.init(CombatHUD.root);
    AncientEchoBanner.init(CombatHUD.root);
    CombatSkillPicker.init(CombatHUD.root);
    CombatPauseMenu.init(CombatHUD.root);
    CombatDeathOverlay.init(CombatHUD.root);
    CultivationToast.init();

    const syncAncientHud = (): void => {
      if (!CombatHUD.root) return;
      const inCombat = !CombatHUD.root.hidden;
      AncientEchoBanner.syncVisible(inCombat);
      PlayerStatusBar.setAncientMode(inCombat && isAncientCombatActive());
    };

    CombatHUD.unsubscribe = EventBus.on('scene:changed', ({ id }) => {
      CombatHUD.applyScene(id);
    });

    CombatHUD.unsubscribeDemo.push(
      EventBus.on('demo:entered', syncAncientHud),
      EventBus.on('demo:exited', syncAncientHud),
    );

    CombatHUD.mounted = true;
  }

  static destroy(): void {
    CombatHUD.unsubscribe?.();
    CombatHUD.unsubscribe = null;
    for (const unsub of CombatHUD.unsubscribeDemo) unsub();
    CombatHUD.unsubscribeDemo = [];
    PlayerStatusBar.destroy();
    CombatLootHint.destroy();
    AncientEchoBanner.destroy();
    CombatSkillPicker.destroy();
    CombatPauseMenu.destroy();
    CombatDeathOverlay.destroy();
    CultivationToast.destroy();
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
    AncientEchoBanner.syncVisible(showCombat);
    PlayerStatusBar.setAncientMode(showCombat && isAncientCombatActive());
    if (!showCombat) {
      CombatSkillPicker.close();
      CombatPauseMenu.close();
      CombatDeathOverlay.close();
    }
  }
}
