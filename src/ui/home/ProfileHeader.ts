import { I18nManager } from '@/core/i18n/I18nManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { gameStore } from '@/core/store/gameStore';
import { computeCombatPowerStub, formatCombatPower } from '@/progression/combatPowerStub';

export interface ProfileHeaderHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

function realmLabelKey(save: PlayerSaveV1): string {
  return `realm.${save.realm.id}.${save.realm.tier}`;
}

function yearsCultivated(totalPlaySeconds: number): number {
  return Math.min(9999, Math.floor(totalPlaySeconds / 3600));
}

export function createProfileHeader(): ProfileHeaderHandles {
  const root = document.createElement('header');
  root.className = 'home-profile home-ui__interactive';

  const nameEl = document.createElement('h1');
  nameEl.className = 'home-profile__name';

  const realmEl = document.createElement('p');
  realmEl.className = 'home-profile__realm';

  const statsRow = document.createElement('div');
  statsRow.className = 'home-profile__stats';

  const cpBlock = document.createElement('div');
  cpBlock.className = 'home-profile__stat';
  const cpLabel = document.createElement('span');
  cpLabel.className = 'home-profile__stat-label';
  cpLabel.textContent = I18nManager.t('home.combat_power');
  const cpValue = document.createElement('span');
  cpValue.className = 'home-profile__stat-value';
  cpBlock.append(cpLabel, cpValue);

  const yearsBlock = document.createElement('div');
  yearsBlock.className = 'home-profile__stat';
  const yearsLabel = document.createElement('span');
  yearsLabel.className = 'home-profile__stat-label';
  yearsLabel.textContent = I18nManager.t('home.years_cultivated');
  const yearsValue = document.createElement('span');
  yearsValue.className = 'home-profile__stat-value';
  yearsBlock.append(yearsLabel, yearsValue);

  statsRow.append(cpBlock, yearsBlock);
  root.append(nameEl, realmEl, statsRow);

  const refresh = (): void => {
    const save = gameStore.getState().save;
    if (!save) return;

    nameEl.textContent = I18nManager.t('hero.wanderer.name');
    realmEl.textContent = I18nManager.t(realmLabelKey(save));
    cpValue.textContent = formatCombatPower(computeCombatPowerStub(save), I18nManager.locale);
    yearsValue.textContent = String(yearsCultivated(save.meta.totalPlaySeconds));
  };

  refresh();

  return {
    root,
    refresh,
    destroy() {
      root.remove();
    },
  };
}
