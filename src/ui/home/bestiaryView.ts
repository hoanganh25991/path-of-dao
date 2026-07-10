import { I18nManager } from '@/core/i18n/I18nManager';
import { getEnemyConfig } from '@/combat/cultivators/CultivatorLoader';
import { getItemDefinition } from '@/progression/ItemLoader';
import { describeCultivatorLootHint } from '@/progression/LootDisplay';
import type { CultivatorLootTier } from '@/combat/systems/lootRoll';

function lootChanceLabel(tier: CultivatorLootTier, chancePercent: number): string {
  switch (tier) {
    case 'boss_first':
      return I18nManager.t('bestiary.loot.boss_first');
    case 'boss_rematch':
      return I18nManager.t('bestiary.loot.boss_rematch', { chance: chancePercent });
    case 'elite':
      return I18nManager.t('bestiary.loot.elite', { chance: chancePercent });
    case 'grunt':
      return I18nManager.t('bestiary.loot.grunt', { chance: chancePercent });
    default:
      return I18nManager.t('bestiary.loot.none');
  }
}

function formatItemPreview(itemIds: string[]): string {
  const names = itemIds.map((id) => {
    try {
      return I18nManager.t(getItemDefinition(id).displayNameKey);
    } catch {
      return id;
    }
  });
  return I18nManager.t('bestiary.loot.items', { items: names.join(', ') });
}

export function renderBestiaryRow(cultivatorId: string): HTMLElement {
  const cultivator = getEnemyConfig(cultivatorId);
  const loot = describeCultivatorLootHint(cultivator, false);

  const row = document.createElement('div');
  row.className = 'home-story__row home-bestiary__row';
  row.dataset.testid = `home-bestiary-row-${cultivatorId}`;

  const main = document.createElement('div');
  main.className = 'home-path__main';

  const kind = document.createElement('span');
  kind.className = 'home-path__kind';
  kind.textContent = I18nManager.t('home.bestiary.kind');

  const title = document.createElement('p');
  title.className = 'home-story__title home-path__title';
  title.textContent = I18nManager.t(cultivator.displayNameKey);

  const lore = document.createElement('p');
  lore.className = 'home-bestiary__lore';
  lore.textContent = cultivator.bestiaryKey
    ? I18nManager.t(cultivator.bestiaryKey)
    : I18nManager.t('home.bestiary.no_lore');

  const drop = document.createElement('p');
  drop.className = 'home-bestiary__drop';
  drop.textContent = lootChanceLabel(loot.tier, loot.chancePercent);

  main.append(kind, title, lore, drop);

  if (loot.itemIds.length > 0) {
    const items = document.createElement('p');
    items.className = 'home-bestiary__items';
    items.textContent = formatItemPreview(loot.itemIds);
    main.appendChild(items);
  }

  if (cultivator.bossClearId) {
    const rematch = describeCultivatorLootHint(cultivator, true);
    const rematchLine = document.createElement('p');
    rematchLine.className = 'home-bestiary__drop home-bestiary__drop--muted';
    rematchLine.textContent = lootChanceLabel(rematch.tier, rematch.chancePercent);
    main.appendChild(rematchLine);
  }

  row.appendChild(main);
  return row;
}
