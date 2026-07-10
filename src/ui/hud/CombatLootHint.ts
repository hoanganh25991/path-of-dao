import { I18nManager } from '@/core/i18n/I18nManager';
import { getMapLootHudHint } from '@/progression/LootDisplay';
import '@/ui/hud/combat-loot-hint.css';

/** Compact combat HUD note — gold every kill, gear drop rates by tier. */
export class CombatLootHint {
  private static root: HTMLElement | null = null;
  private static mounted = false;

  static init(parent: HTMLElement): void {
    if (CombatLootHint.mounted) return;

    const root = document.createElement('p');
    root.className = 'combat-loot-hint';
    root.dataset.testid = 'combat-loot-hint';
    parent.appendChild(root);
    CombatLootHint.root = root;
    CombatLootHint.mounted = true;
    CombatLootHint.refresh();
  }

  static destroy(): void {
    CombatLootHint.root?.remove();
    CombatLootHint.root = null;
    CombatLootHint.mounted = false;
  }

  static refresh(): void {
    if (!CombatLootHint.root) return;
    const hint = getMapLootHudHint();
    CombatLootHint.root.textContent = I18nManager.t('combat.loot.hint.hud', hint);
  }
}
