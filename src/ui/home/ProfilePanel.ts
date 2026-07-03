import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { gameStore } from '@/core/store/gameStore';
import {
  computeCombatPowerFromSave,
  formatCombatPower,
  resolveStatsForCombatPower,
  yearsCultivated,
} from '@/progression/CombatPower';
import { getRealmOrder } from '@/progression/RealmStatScaling';

export interface ProfilePanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

function realmLabelKey(save: PlayerSaveV1): string {
  return `realm.${save.realm.id}.${save.realm.tier}`;
}

function formatPlayTime(totalPlaySeconds: number): string {
  const hours = Math.floor(totalPlaySeconds / 3600);
  const minutes = Math.floor((totalPlaySeconds % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatMultiplier(value: number): string {
  return `${value.toFixed(2)}×`;
}

function addStatRow(
  grid: HTMLElement,
  labelKey: string,
  value: string,
): void {
  const row = document.createElement('div');
  row.className = 'home-profile-panel__row';

  const label = document.createElement('span');
  label.className = 'home-profile-panel__label';
  label.textContent = I18nManager.t(labelKey);

  const val = document.createElement('span');
  val.className = 'home-profile-panel__value';
  val.textContent = value;

  row.append(label, val);
  grid.append(row);
}

export function createProfilePanel(onClose: () => void): ProfilePanelHandles {
  const root = document.createElement('div');
  root.className = 'home-profile-panel home-ui__interactive';
  root.dataset.testid = 'home-profile-panel';

  root.addEventListener('click', (event) => {
    if (event.target === root) onClose();
  });

  const card = document.createElement('div');
  card.className = 'home-profile-panel__card';

  const header = document.createElement('div');
  header.className = 'home-profile-panel__header';

  const title = document.createElement('h2');
  title.className = 'home-profile-panel__title';
  title.textContent = I18nManager.t('home.profile.title');

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'home-profile-panel__close';
  closeBtn.setAttribute('aria-label', I18nManager.t('home.profile.close'));
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', onClose);

  header.append(title, closeBtn);

  const grid = document.createElement('div');
  grid.className = 'home-profile-panel__grid';

  card.append(header, grid);
  root.append(card);

  const refresh = (): void => {
    const save = gameStore.getState().save;
    if (!save) return;

    grid.replaceChildren();

    const resolved = resolveStatsForCombatPower(save);
    const realmOrder = getRealmOrder(save.realm.id);
    const cp = computeCombatPowerFromSave(save);
    const awakenedCount = Object.values(save.insights).filter((i) => i.awakened).length;

    addStatRow(grid, 'home.profile.level', String(save.stats.level));
    addStatRow(grid, 'home.profile.realm', I18nManager.t(realmLabelKey(save)));
    addStatRow(grid, 'home.combat_power', formatCombatPower(cp, I18nManager.locale));
    addStatRow(
      grid,
      'home.profile.hp',
      `${save.runtime.hp} / ${resolved.hpMax}`,
    );
    addStatRow(
      grid,
      'home.profile.mana',
      `${save.runtime.mana} / ${resolved.manaMax}`,
    );
    addStatRow(grid, 'home.profile.atk', String(resolved.atk));
    addStatRow(grid, 'home.profile.def', String(resolved.def));
    addStatRow(grid, 'home.profile.crit', formatPercent(resolved.crit));
    addStatRow(grid, 'home.profile.crit_dmg', formatMultiplier(resolved.critDmg));
    addStatRow(grid, 'home.profile.speed', String(resolved.speed));
    addStatRow(grid, 'home.profile.spirit', String(resolved.spirit));
    addStatRow(grid, 'home.profile.play_time', formatPlayTime(save.meta.totalPlaySeconds));
    addStatRow(grid, 'home.profile.maps_cleared', String(save.progress.clearedMaps.length));
    addStatRow(grid, 'home.profile.bosses_defeated', String(save.progress.clearedBosses.length));
    addStatRow(
      grid,
      'home.years_cultivated',
      I18nManager.t('home.profile.years_value', {
        years: String(yearsCultivated(save.meta.totalPlaySeconds, realmOrder)),
      }),
    );
    addStatRow(grid, 'home.profile.awakenings', String(awakenedCount));
  };

  refresh();

  const unsubscribeCp = EventBus.on('cp:changed', () => {
    refresh();
  });

  return {
    root,
    refresh,
    destroy() {
      unsubscribeCp();
      root.remove();
    },
  };
}
