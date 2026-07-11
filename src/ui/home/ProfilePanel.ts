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
import { EquipmentManager } from '@/progression/EquipmentManager';
import {
  EQUIPMENT_SLOTS,
  type EquipmentSlot,
  type ItemDefinition,
} from '@/progression/ItemDefinition';
import { getItemDefinition } from '@/progression/ItemLoader';
import { getInsightIntentConfig } from '@/progression/InsightDefinitions';
import {
  checkAwakeningReady,
  getInsightState,
  insightDisplayPct,
} from '@/progression/InsightSystem';
import { listDiscoveredIntentIds } from '@/progression/SkillLoadout';
import { showAwakeningModal } from '@/ui/modals/AwakeningModal';
import { getSkillIconSrc } from '@/combat/art/skillIconDraw';

export type ProfileSubTab = 'stats' | 'dharma' | 'divine' | 'intent' | 'destiny';

const SIGNATURE_INTENT_ICONS: Record<string, string> = {
  sword: '⚔',
  truth_falsehood: '◈',
  flame: '🔥',
  lightning: '⚡',
  cause_effect: '⏳',
  life_death: '✦',
};

const ALL_INTENT_IDS = ['life_death', 'cause_effect', 'truth_falsehood', 'sword', 'flame', 'lightning'];

export interface ProfilePanelHandles {
  root: HTMLElement;
  refresh(): void;
  hide(): void;
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

function formatPool(current: number, max: number): string {
  return `${Math.round(current)} / ${Math.round(max)}`;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9d9d9d',
  uncommon: '#2dd4a8',
  rare: '#4da6ff',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

function itemAbbrev(def: ItemDefinition, maxLen = 2): string {
  const name = I18nManager.t(def.displayNameKey);
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    return words
      .slice(0, maxLen)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
  }
  return name.slice(0, maxLen).toUpperCase();
}

function equippedSlot(save: PlayerSaveV1, itemId: string): EquipmentSlot | null {
  for (const slot of EQUIPMENT_SLOTS) {
    if (save.equipped[slot] === itemId) return slot;
  }
  return null;
}

function slotLabelKey(slot: EquipmentSlot): string {
  return `home.slot.${slot}`;
}

export function createProfilePanel(): ProfilePanelHandles {
  const root = document.createElement('div');
  root.className = 'home-panel home-profile';
  root.dataset.panel = 'profile';

  // Sub-tab bar
  const subTabs = document.createElement('div');
  subTabs.className = 'home-profile__sub-tabs';
  const subTabDefs: { id: ProfileSubTab; key: string }[] = [
    { id: 'stats', key: 'home.profile.title' },
    { id: 'dharma', key: 'home.nav.dharma' },
    { id: 'divine', key: 'home.nav.divine_abilities' },
    { id: 'intent', key: 'home.nav.intents' },
    { id: 'destiny', key: 'destiny.tab' },
  ];
  const subTabButtons: HTMLElement[] = [];
  for (const { id, key } of subTabDefs) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'home-profile__sub-tab';
    btn.dataset.subTab = id;
    btn.textContent = I18nManager.t(key);
    subTabs.appendChild(btn);
    subTabButtons.push(btn);
  }

  // Content area
  const content = document.createElement('div');
  content.className = 'home-profile__content';

  // Stats content
  const statsRoot = document.createElement('div');
  statsRoot.className = 'home-stats-section';
  const statsGrid = document.createElement('div');
  statsGrid.className = 'home-stats-section__grid';
  statsRoot.appendChild(statsGrid);

  // Dharma content
  const dharmaRoot = document.createElement('div');
  dharmaRoot.className = 'home-dharma-section';
  const dharmaSlotsRow = document.createElement('div');
  dharmaSlotsRow.className = 'home-dharma__slots';
  const dharmaInventoryLabel = document.createElement('h3');
  dharmaInventoryLabel.className = 'home-dharma__inventory-label';
  dharmaInventoryLabel.textContent = I18nManager.t('home.dharma.inventory');
  const dharmaGrid = document.createElement('div');
  dharmaGrid.className = 'home-dharma__grid';
  dharmaRoot.append(dharmaSlotsRow, dharmaInventoryLabel, dharmaGrid);

  // Divine content
  const divineRoot = document.createElement('div');
  divineRoot.className = 'home-divine-section';
  const divineTitle = document.createElement('h2');
  divineTitle.className = 'home-panel__title';
  divineTitle.textContent = I18nManager.t('home.nav.divine_abilities');
  const divineIntro = document.createElement('p');
  divineIntro.className = 'home-divine-section__intro';
  divineIntro.textContent = I18nManager.t('home.divine.intro');
  const divineList = document.createElement('div');
  divineList.className = 'home-divine-section__list';
  const divineEmpty = document.createElement('p');
  divineEmpty.className = 'home-divine-section__empty';
  divineEmpty.hidden = true;
  divineEmpty.textContent = I18nManager.t('home.divine.empty');
  divineRoot.append(divineTitle, divineIntro, divineList, divineEmpty);

  // Intent content
  const intentRoot = document.createElement('div');
  intentRoot.className = 'home-intent-section';
  const intentTitle = document.createElement('h2');
  intentTitle.className = 'home-panel__title';
  intentTitle.textContent = I18nManager.t('home.nav.intents');
  const intentIntro = document.createElement('p');
  intentIntro.className = 'home-intent-section__intro';
  intentIntro.textContent = I18nManager.t('home.intent.intro');
  const intentList = document.createElement('div');
  intentList.className = 'home-intent-section__list';
  const intentEmpty = document.createElement('p');
  intentEmpty.className = 'home-intent-section__empty';
  intentEmpty.hidden = true;
  intentEmpty.textContent = I18nManager.t('home.intent.semantics.empty');
  intentRoot.append(intentTitle, intentIntro, intentList, intentEmpty);

  // Destiny point spending
  const destinyRoot = document.createElement('div');
  destinyRoot.className = 'home-destiny-section';
  const destinyTitle = document.createElement('h2');
  destinyTitle.className = 'home-panel__title';
  destinyTitle.textContent = I18nManager.t('destiny.tab');
  const destinyIntro = document.createElement('p');
  destinyIntro.className = 'home-destiny-section__intro';
  destinyIntro.textContent = I18nManager.t('destiny.intro');
  const destinySummary = document.createElement('div');
  destinySummary.className = 'home-destiny-section__summary';
  const destinySpend = document.createElement('div');
  destinySpend.className = 'home-destiny-section__spend';
  destinyRoot.append(destinyTitle, destinyIntro, destinySummary, destinySpend);

  content.append(statsRoot, dharmaRoot, divineRoot, intentRoot, destinyRoot);
  root.append(subTabs, content);

  let activeSubTab: ProfileSubTab = 'stats';
  let detailOverlay: HTMLElement | null = null;
  let ceremonyActive = false;
  let dharmaSlotFilter: EquipmentSlot | null = null;

  function switchSubTab(id: ProfileSubTab): void {
    if (id !== 'dharma') closeDetail();
    activeSubTab = id;
    for (const btn of subTabButtons) {
      btn.classList.toggle('home-profile__sub-tab--active', btn.dataset.subTab === id);
    }
    statsRoot.hidden = id !== 'stats';
    dharmaRoot.hidden = id !== 'dharma';
    divineRoot.hidden = id !== 'divine';
    intentRoot.hidden = id !== 'intent';
    destinyRoot.hidden = id !== 'destiny';
    render();
  }

  function addStatRow(labelKey: string, value: string): void {
    const row = document.createElement('div');
    row.className = 'home-stats-section__row';
    const label = document.createElement('span');
    label.className = 'home-stats-section__label';
    label.textContent = I18nManager.t(labelKey);
    const val = document.createElement('span');
    val.className = 'home-stats-section__value';
    val.textContent = value;
    row.append(label, val);
    statsGrid.append(row);
  }

  function renderStats(): void {
    const save = gameStore.getState().save;
    if (!save) return;
    statsGrid.replaceChildren();

    const resolved = resolveStatsForCombatPower(save);
    const realmOrder = getRealmOrder(save.realm.id);
    const cp = computeCombatPowerFromSave(save);
    const awakenedCount = Object.values(save.insights).filter((i) => i.awakened).length;

    addStatRow('home.profile.level', String(save.stats.level));
    addStatRow('home.profile.realm', I18nManager.t(realmLabelKey(save)));
    addStatRow('home.combat_power', formatCombatPower(cp, I18nManager.locale));
    addStatRow('home.profile.hp', formatPool(save.runtime.hp, resolved.hpMax));
    addStatRow('home.profile.mana', formatPool(save.runtime.mana, resolved.manaMax));
    addStatRow('home.profile.atk', String(resolved.atk));
    addStatRow('home.profile.def', String(resolved.def));
    addStatRow('home.profile.crit', formatPercent(resolved.crit));
    addStatRow('home.profile.crit_dmg', formatMultiplier(resolved.critDmg));
    addStatRow('home.profile.speed', String(resolved.speed));
    addStatRow('home.profile.spirit', String(resolved.spirit));
    addStatRow('home.profile.play_time', formatPlayTime(save.meta.totalPlaySeconds));
    addStatRow('home.profile.maps_cleared', String(save.progress.clearedMaps.length));
    addStatRow('home.profile.bosses_defeated', String(save.progress.clearedBosses.length));
    addStatRow('home.years_cultivated', I18nManager.t('home.profile.years_value', {
      years: String(yearsCultivated(save.meta.totalPlaySeconds, realmOrder)),
    }));
    addStatRow('home.profile.awakenings', String(awakenedCount));
    const dp = save.destinyPoints ?? { dharma: 0, divine: 0, intent: 0, unspent: 0 };
    addStatRow('destiny.unspent_points', I18nManager.t('destiny.summary', {
      unspent: String(dp.unspent),
      dharma: String(dp.dharma),
      divine: String(dp.divine),
      intent: String(dp.intent),
    }));
  }

  function detailHost(): HTMLElement {
    return document.getElementById('ui-root') ?? document.body;
  }

  function closeDetail(): void {
    detailOverlay?.remove();
    detailOverlay = null;
  }

  function showEquipErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'home-toast home-ui__interactive';
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.addEventListener('animationend', () => toast.remove());
  }

  function openDharmaDetail(itemId: string): void {
    closeDetail();
    const save = gameStore.getState().save;
    if (!save) return;

    let def: ItemDefinition;
    try { def = getItemDefinition(itemId); } catch { return; }

    const slot = equippedSlot(save, itemId);
    const equipped = slot !== null;
    const rarityColor = RARITY_COLORS[def.rarity] ?? 'var(--dao-gold)';

    detailOverlay = document.createElement('div');
    detailOverlay.className = 'home-item-detail home-ui__interactive';
    detailOverlay.addEventListener('click', (event) => {
      if (event.target === detailOverlay) closeDetail();
    });

    const card = document.createElement('div');
    card.className = 'home-item-detail__card';

    // Header: rarity badge + name
    const header = document.createElement('div');
    header.className = 'home-item-detail__header';

    const rarityBadge = document.createElement('span');
    rarityBadge.className = 'home-item-detail__rarity';
    rarityBadge.textContent = I18nManager.t(`dharma.tier.${def.rarity}`) || def.rarity.toUpperCase();
    rarityBadge.style.color = rarityColor;
    rarityBadge.style.borderColor = rarityColor;

    const name = document.createElement('h3');
    name.className = 'home-item-detail__name';
    name.textContent = I18nManager.t(def.displayNameKey);

    header.append(rarityBadge, name);

    // Slot info
    const slotRow = document.createElement('div');
    slotRow.className = 'home-item-detail__slot-row';

    const slotIcon = document.createElement('span');
    slotIcon.className = 'home-item-detail__slot-badge';
    slotIcon.textContent = I18nManager.t(slotLabelKey(def.slot as EquipmentSlot));

    const slotStatus = document.createElement('span');
    slotStatus.className = equipped
      ? 'home-item-detail__status home-item-detail__status--equipped'
      : 'home-item-detail__status';
    slotStatus.textContent = equipped
      ? I18nManager.t('home.dharma.equipped')
      : '';

    const levelReq = document.createElement('span');
    levelReq.className = 'home-item-detail__level-req';
    levelReq.textContent = I18nManager.t('home.profile.level') + ' ' + def.requiredLevel;

    slotRow.append(slotIcon, levelReq, slotStatus);

    // Description
    const desc = document.createElement('p');
    desc.className = 'home-item-detail__desc';
    desc.textContent = I18nManager.t(def.descriptionKey);

    // Modifiers
    const mods = document.createElement('ul');
    mods.className = 'home-item-detail__mods';
    for (const mod of def.modifiers) {
      const li = document.createElement('li');
      const sign = mod.value >= 0 ? '+' : '';
      const suffix = mod.kind === 'percent' ? '%' : '';
      li.textContent = `${mod.stat.toUpperCase()} ${sign}${mod.value}${suffix}`;
      mods.appendChild(li);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'home-item-detail__actions';

    const primary = document.createElement('button');
    primary.type = 'button';
    primary.className = 'home-item-detail__btn home-item-detail__btn--primary';
    primary.dataset.action = equipped ? 'unequip' : 'equip';
    primary.dataset.itemId = itemId;
    primary.textContent = equipped
      ? I18nManager.t('home.dharma.unequip')
      : I18nManager.t('home.dharma.equip');

    primary.addEventListener('click', () => {
      if (equipped && slot) {
        EquipmentManager.unequip(slot);
        closeDetail();
        renderDharma();
      } else {
        const result = EquipmentManager.equip(itemId);
        if (result.ok) {
          closeDetail();
          renderDharma();
        } else {
          const reason = result.reason!;
          let msg: string;
          if (reason === 'level_too_low') {
            try {
              const def = getItemDefinition(itemId);
              msg = I18nManager.t('home.dharma.equip_fail_level', { level: String(def.requiredLevel) });
            } catch {
              msg = I18nManager.t('home.dharma.equip_fail_level', { level: '?' });
            }
          } else if (reason === 'wrong_slot') {
            msg = I18nManager.t('home.dharma.equip_fail_slot');
          } else if (reason === 'not_in_inventory') {
            msg = I18nManager.t('home.dharma.equip_fail_inventory');
          } else {
            msg = I18nManager.t('home.dharma.equip_fail_unknown');
          }
          showEquipErrorToast(msg);
        }
      }
    });

    const secondary = document.createElement('button');
    secondary.type = 'button';
    secondary.className = 'home-item-detail__btn home-item-detail__btn--secondary';
    secondary.textContent = I18nManager.t('home.dharma.close');
    secondary.addEventListener('click', closeDetail);

    actions.append(primary, secondary);
    card.append(header, slotRow, desc, mods, actions);
    detailOverlay.appendChild(card);
    detailHost().appendChild(detailOverlay);
  }

  function renderDharma(): void {
    const save = gameStore.getState().save;
    if (!save) return;

    dharmaSlotsRow.replaceChildren();
    for (const slot of EQUIPMENT_SLOTS) {
      const itemId = save.equipped[slot];
      const slotEl = document.createElement('button');
      slotEl.type = 'button';
      slotEl.className = 'home-dharma__slot';
      if (dharmaSlotFilter === slot) slotEl.classList.add('home-dharma__slot--active');

      const icon = document.createElement('div');
      icon.className = 'home-dharma__slot-icon';

      if (itemId) {
        slotEl.classList.add('home-dharma__slot--filled');
        try {
          const def = getItemDefinition(itemId);
          icon.textContent = itemAbbrev(def);
          icon.style.color = RARITY_COLORS[def.rarity] ?? 'var(--dao-jade)';
          slotEl.title = `${I18nManager.t(def.displayNameKey)} — ${I18nManager.t('home.dharma.unequip')}`;
        } catch {
          icon.textContent = '?';
        }
      } else {
        icon.textContent = '·';
        slotEl.title = I18nManager.t('home.dharma.slot_click_to_filter');
      }

      const label = document.createElement('span');
      label.className = 'home-dharma__slot-label';
      label.textContent = I18nManager.t(slotLabelKey(slot));
      slotEl.append(icon, label);

      slotEl.addEventListener('click', () => {
        if (itemId) {
          EquipmentManager.unequip(slot);
          closeDetail();
          if (dharmaSlotFilter === slot) dharmaSlotFilter = null;
          renderDharma();
        } else {
          dharmaSlotFilter = dharmaSlotFilter === slot ? null : slot;
          renderDharma();
        }
      });

      dharmaSlotsRow.appendChild(slotEl);
    }

    dharmaInventoryLabel.hidden = true;
    dharmaGrid.replaceChildren();

    const inventoryIds = save.inventory.items
      .filter((entry) => entry.qty > 0)
      .map((entry) => entry.id);

    const visibleIds = dharmaSlotFilter
      ? inventoryIds.filter((id) => {
          try { return getItemDefinition(id).slot === dharmaSlotFilter; } catch { return false; }
        })
      : inventoryIds;

    if (visibleIds.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'home-panel__empty';
      empty.style.gridColumn = '1 / -1';
      empty.textContent = dharmaSlotFilter
        ? I18nManager.t('home.dharma.slot_empty', { slot: I18nManager.t(slotLabelKey(dharmaSlotFilter)) })
        : I18nManager.t('home.dharma.empty');
      dharmaGrid.appendChild(empty);
      return;
    }

    dharmaInventoryLabel.hidden = false;

    for (const itemId of visibleIds) {
      let def: ItemDefinition;
      try { def = getItemDefinition(itemId); } catch { continue; }

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'home-dharma__card';
      card.dataset.itemId = itemId;
      card.dataset.testid = `dharma-card-${itemId}`;

      const rarityColor = RARITY_COLORS[def.rarity] ?? 'var(--dao-text)';
      card.style.borderColor = rarityColor;

      const initial = document.createElement('span');
      initial.className = 'home-dharma__card-label';
      initial.textContent = itemAbbrev(def);
      initial.style.color = rarityColor;

      const slotBadge = document.createElement('span');
      slotBadge.className = 'home-dharma__card-slot';
      slotBadge.textContent = I18nManager.t(slotLabelKey(def.slot as EquipmentSlot));

      card.append(initial, slotBadge);
      card.addEventListener('click', () => openDharmaDetail(itemId));
      dharmaGrid.appendChild(card);
    }
  }

  function renderDivine(): void {
    const save = gameStore.getState().save;
    if (!save) return;

    divineList.replaceChildren();

    const discovered = listDiscoveredIntentIds(save);
    divineEmpty.hidden = discovered.length > 0;

    for (const intentId of discovered) {
      const config = getInsightIntentConfig(intentId);
      const state = getInsightState(save, intentId);
      const progress = state ? (state.awakened ? 100 : insightDisplayPct(state.xp)) : 0;
      const ready = checkAwakeningReady(save, intentId);
      const signatureSkillId = state?.awakened ? config.awakenedSkillId : config.baseSkillId;

      const row = document.createElement('div');
      row.className = 'home-divine-section__row';
      row.dataset.testid = `home-divine-intent-${intentId}`;
      if (state?.awakened) row.classList.add('home-divine-section__row--awakened');
      if (ready) row.classList.add('home-divine-section__row--ready');

      // DA-04 — 24×24 procedural (or DA-08 authored PNG) intent icon.
      const icon = document.createElement('div');
      icon.className = 'home-divine-section__icon';
      icon.setAttribute('aria-hidden', 'true');
      const iconImg = document.createElement('img');
      iconImg.className = 'home-divine-section__icon-img';
      iconImg.src = getSkillIconSrc(signatureSkillId);
      iconImg.width = 24;
      iconImg.height = 24;
      iconImg.alt = '';
      icon.appendChild(iconImg);

      const info = document.createElement('div');
      info.className = 'home-divine-section__info';

      const name = document.createElement('p');
      name.className = 'home-divine-section__name';
      name.textContent = I18nManager.t(`${config.baseSkillId}.name`);
      if (state?.awakened) {
        name.textContent = I18nManager.t(`${config.awakenedSkillId}.name`);
      }

      const bar = document.createElement('div');
      bar.className = 'home-divine-section__bar';
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(progress));

      const fill = document.createElement('div');
      fill.className = 'home-divine-section__bar-fill';
      fill.style.width = `${progress}%`;
      bar.appendChild(fill);

      info.append(name, bar);

      if (ready) {
        const awakenBtn = document.createElement('button');
        awakenBtn.type = 'button';
        awakenBtn.className = 'home-divine-section__awaken';
        awakenBtn.textContent = I18nManager.t('home.intent.awaken');
        awakenBtn.addEventListener('click', () => {
          if (ceremonyActive) return;
          const uiRoot = document.getElementById('ui-root');
          if (!uiRoot) return;
          ceremonyActive = true;
          void showAwakeningModal(uiRoot, { intentId }).finally(() => {
            ceremonyActive = false;
            renderDivine();
          });
        });
        row.append(icon, info, awakenBtn);
      } else {
        row.append(icon, info);
      }

      divineList.appendChild(row);
    }
  }

  function renderIntent(): void {
    const save = gameStore.getState().save;
    if (!save) return;

    intentList.replaceChildren();

    let anyDiscovered = false;
    for (const intentId of ALL_INTENT_IDS) {
      const iconChar = SIGNATURE_INTENT_ICONS[intentId] ?? '✦';
      const state = save.insights[intentId] ?? null;
      const discovered = state !== null && (state.xp > 0 || state.totalUses > 0 || state.awakened);
      if (discovered) anyDiscovered = true;
      const progress = state ? (state.awakened ? 100 : insightDisplayPct(state.xp || 0)) : 0;
      const ready = state ? checkAwakeningReady(save, intentId) : false;

      const row = document.createElement('div');
      row.className = 'home-intent-section__row';
      if (discovered) row.classList.add('home-intent-section__row--discovered');
      if (state?.awakened) row.classList.add('home-intent-section__row--awakened');
      if (ready) row.classList.add('home-intent-section__row--ready');

      const icon = document.createElement('div');
      icon.className = 'home-intent-section__icon';
      icon.textContent = iconChar;
      icon.setAttribute('aria-hidden', 'true');

      const info = document.createElement('div');
      info.className = 'home-intent-section__info';

      const name = document.createElement('p');
      name.className = 'home-intent-section__name';
      name.textContent = I18nManager.t(`intent.${intentId}`);

      const desc = document.createElement('p');
      desc.className = 'home-intent-section__desc';
      desc.textContent = I18nManager.t(`intent.${intentId}.desc`);

      if (discovered) {
        const bar = document.createElement('div');
        bar.className = 'home-intent-section__bar';
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', '100');
        bar.setAttribute('aria-valuenow', String(progress));

        const fill = document.createElement('div');
        fill.className = 'home-intent-section__bar-fill';
        fill.style.width = `${progress}%`;
        bar.appendChild(fill);

        info.append(name, desc, bar);

        if (ready) {
          const awakenBtn = document.createElement('button');
          awakenBtn.type = 'button';
          awakenBtn.className = 'home-intent-section__awaken';
          awakenBtn.textContent = I18nManager.t('home.intent.awaken');
          awakenBtn.addEventListener('click', () => {
            const uiRoot = document.getElementById('ui-root');
            if (!uiRoot) return;
            void showAwakeningModal(uiRoot, { intentId });
          });
          info.appendChild(awakenBtn);
        }
      } else {
        info.append(name);
      }

      row.append(icon, info);
      intentList.appendChild(row);
    }

    intentEmpty.hidden = anyDiscovered;
  }

  function renderDestiny(): void {
    const save = gameStore.getState().save;
    if (!save) return;

    const dp = save.destinyPoints ?? { dharma: 0, divine: 0, intent: 0, unspent: 0 };

    // Summary bar
    destinySummary.replaceChildren();
    const summaryText = document.createElement('p');
    summaryText.className = 'home-destiny-section__summary-text';
    summaryText.textContent = I18nManager.t('destiny.summary', {
      unspent: String(dp.unspent),
      dharma: String(dp.dharma),
      divine: String(dp.divine),
      intent: String(dp.intent),
    });
    destinySummary.appendChild(summaryText);

    destinySpend.replaceChildren();

    if (dp.unspent <= 0) {
      const empty = document.createElement('p');
      empty.className = 'home-destiny-section__empty';
      empty.textContent = I18nManager.t('destiny.empty');
      destinySpend.appendChild(empty);
      return;
    }

    // Three spend buttons
    const spendTargets: { key: string; kind: keyof typeof dp; labelKey: string; descKey: string }[] = [
      { key: 'dharma', kind: 'dharma', labelKey: 'destiny.option.dharma.label', descKey: 'destiny.spend.dharma.desc' },
      { key: 'divine', kind: 'divine', labelKey: 'destiny.option.divine.label', descKey: 'destiny.spend.divine.desc' },
      { key: 'intent', kind: 'intent', labelKey: 'destiny.option.intent.label', descKey: 'destiny.spend.intent.desc' },
    ];

    for (const target of spendTargets) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'home-destiny-section__spend-btn';

      const label = document.createElement('span');
      label.className = 'home-destiny-section__spend-label';
      label.textContent = I18nManager.t(target.labelKey);

      const desc = document.createElement('span');
      desc.className = 'home-destiny-section__spend-desc';
      desc.textContent = I18nManager.t(target.descKey);

      const count = document.createElement('span');
      count.className = 'home-destiny-section__spend-count';
      count.textContent = String(dp[target.kind]);

      btn.append(label, desc, count);

      btn.addEventListener('click', () => {
        const current = gameStore.getState().save;
        if (!current) return;
        const currentDp = current.destinyPoints ?? { dharma: 0, divine: 0, intent: 0, unspent: 0 };
        if (currentDp.unspent <= 0) return;

        gameStore.getState().patch({
          destinyPoints: {
            ...currentDp,
            unspent: currentDp.unspent - 1,
            [target.kind]: currentDp[target.kind] + 1,
          },
        });
        void gameStore.getState().persist();
        renderDestiny();
      });

      destinySpend.appendChild(btn);
    }
  }

  function render(): void {
    switch (activeSubTab) {
      case 'stats': renderStats(); break;
      case 'dharma': renderDharma(); break;
      case 'divine': renderDivine(); break;
      case 'intent': renderIntent(); break;
      case 'destiny': renderDestiny(); break;
    }
  }

  // Event subscriptions
  for (const btn of subTabButtons) {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.subTab as ProfileSubTab;
      switchSubTab(tabId);
    });
  }

  const unsubscribeEquipment = EventBus.on('equipment:changed', () => {
    if (activeSubTab === 'dharma') renderDharma();
  });

  const unsubscribeCp = EventBus.on('cp:changed', () => {
    if (activeSubTab === 'stats') renderStats();
  });

  // Initial render
  switchSubTab('stats');

  return {
    root,
    refresh: render,
    hide: closeDetail,
    destroy() {
      closeDetail();
      unsubscribeEquipment();
      unsubscribeCp();
      root.remove();
    },
  };
}