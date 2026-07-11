import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { gameStore } from '@/core/store/gameStore';
import { EquipmentManager } from '@/progression/EquipmentManager';
import {
  EQUIPMENT_SLOTS,
  type EquipmentSlot,
  type ItemDefinition,
} from '@/progression/ItemDefinition';
import { getItemDefinition } from '@/progression/ItemLoader';
import { getItemIconSrc } from '@/combat/art/itemIconDraw';

export interface InventoryPanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

function slotLabelKey(slot: EquipmentSlot): string {
  return `home.slot.${slot}`;
}

function isEquipped(save: PlayerSaveV1, itemId: string): boolean {
  return EQUIPMENT_SLOTS.some((slot) => save.equipped[slot] === itemId);
}

function equippedSlot(save: PlayerSaveV1, itemId: string): EquipmentSlot | null {
  for (const slot of EQUIPMENT_SLOTS) {
    if (save.equipped[slot] === itemId) return slot;
  }
  return null;
}

export function createInventoryPanel(): InventoryPanelHandles {
  const root = document.createElement('div');
  root.className = 'home-panel home-inventory';
  root.dataset.panel = 'inventory';

  const title = document.createElement('h2');
  title.className = 'home-panel__title';
  title.textContent = I18nManager.t('home.nav.inventory');

  const slotsRow = document.createElement('div');
  slotsRow.className = 'home-inventory__slots';

  const grid = document.createElement('div');
  grid.className = 'home-inventory__grid';

  root.append(title, slotsRow, grid);

  let detailOverlay: HTMLElement | null = null;

  const detailHost = (): HTMLElement => document.getElementById('ui-root') ?? document.body;

  const closeDetail = (): void => {
    detailOverlay?.remove();
    detailOverlay = null;
  };

  const openDetail = (itemId: string): void => {
    closeDetail();
    const save = gameStore.getState().save;
    if (!save) return;

    let def: ItemDefinition;
    try {
      def = getItemDefinition(itemId);
    } catch {
      return;
    }

    const slot = equippedSlot(save, itemId);
    const equipped = slot !== null;

    detailOverlay = document.createElement('div');
    detailOverlay.className = 'home-item-detail home-ui__interactive';
    detailOverlay.addEventListener('click', (event) => {
      if (event.target === detailOverlay) closeDetail();
    });

    const card = document.createElement('div');
    card.className = 'home-item-detail__card';

    const headerIcon = document.createElement('img');
    headerIcon.className = 'home-item-detail__icon-img';
    headerIcon.src = getItemIconSrc(itemId);
    headerIcon.width = 24;
    headerIcon.height = 24;
    headerIcon.alt = '';

    const name = document.createElement('h3');
    name.className = 'home-item-detail__name';
    name.textContent = I18nManager.t(def.displayNameKey);

    const desc = document.createElement('p');
    desc.className = 'home-item-detail__desc';
    desc.textContent = I18nManager.t(def.descriptionKey);

    const mods = document.createElement('ul');
    mods.className = 'home-item-detail__mods';
    for (const mod of def.modifiers) {
      const li = document.createElement('li');
      const sign = mod.value >= 0 ? '+' : '';
      const suffix = mod.kind === 'percent' ? '%' : '';
      li.textContent = `${mod.stat.toUpperCase()} ${sign}${mod.value}${suffix}`;
      mods.appendChild(li);
    }

    const actions = document.createElement('div');
    actions.className = 'home-item-detail__actions';

    const primary = document.createElement('button');
    primary.type = 'button';
    primary.className = 'home-item-detail__btn home-item-detail__btn--primary';
    primary.dataset.action = equipped ? 'unequip' : 'equip';
    primary.dataset.itemId = itemId;
    primary.textContent = equipped
      ? I18nManager.t('home.inventory.unequip')
      : I18nManager.t('home.inventory.equip');

    primary.addEventListener('click', () => {
      if (equipped && slot) {
        EquipmentManager.unequip(slot);
        closeDetail();
        refresh();
      } else {
        const result = EquipmentManager.equip(itemId);
        if (result.ok) {
          closeDetail();
          refresh();
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
          const toast = document.createElement('div');
          toast.className = 'home-toast home-ui__interactive';
          toast.textContent = msg;
          document.body.appendChild(toast);
          toast.addEventListener('animationend', () => toast.remove());
        }
      }
    });

    const secondary = document.createElement('button');
    secondary.type = 'button';
    secondary.className = 'home-item-detail__btn home-item-detail__btn--secondary';
    secondary.textContent = '✕';
    secondary.setAttribute('aria-label', I18nManager.t('home.dharma.close'));
    secondary.addEventListener('click', closeDetail);

    actions.append(primary, secondary);
    card.append(headerIcon, name, desc, mods, actions);
    detailOverlay.appendChild(card);
    detailHost().appendChild(detailOverlay);
  };

  const refresh = (): void => {
    const save = gameStore.getState().save;
    if (!save) return;

    slotsRow.replaceChildren();
    for (const slot of EQUIPMENT_SLOTS) {
      const itemId = save.equipped[slot];
      const slotEl = document.createElement('div');
      slotEl.className = 'home-inventory__slot';

      const icon = document.createElement('div');
      icon.className = 'home-inventory__slot-icon';

      if (itemId) {
        slotEl.classList.add('home-inventory__slot--filled');
        const iconImg = document.createElement('img');
        iconImg.className = 'home-inventory__slot-icon-img';
        iconImg.src = getItemIconSrc(itemId);
        iconImg.width = 24;
        iconImg.height = 24;
        iconImg.alt = '';
        icon.appendChild(iconImg);
        slotEl.title = I18nManager.t(getItemDefinition(itemId).displayNameKey);
      } else {
        icon.textContent = '·';
      }

      const label = document.createElement('span');
      label.textContent = I18nManager.t(slotLabelKey(slot));

      slotEl.append(icon, label);
      slotsRow.appendChild(slotEl);
    }

    grid.replaceChildren();

    const inventoryIds = save.inventory.items.filter((entry) => entry.qty > 0).map((entry) => entry.id);
    const equippedIds = EQUIPMENT_SLOTS.map((slot) => save.equipped[slot]).filter(
      (id): id is string => id !== null,
    );
    const allIds = [...new Set([...inventoryIds, ...equippedIds])];

    if (allIds.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'home-panel__empty';
      empty.style.gridColumn = '1 / -1';
      empty.textContent = I18nManager.t('home.inventory.empty');
      grid.appendChild(empty);
      return;
    }

    for (const itemId of allIds) {
      let def: ItemDefinition;
      try {
        def = getItemDefinition(itemId);
      } catch {
        continue;
      }

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'home-inventory__card';
      card.dataset.itemId = itemId;
      if (isEquipped(save, itemId)) {
        card.classList.add('home-inventory__card--equipped');
      }

      const iconImg = document.createElement('img');
      iconImg.className = 'home-inventory__card-icon-img';
      iconImg.src = getItemIconSrc(itemId);
      iconImg.width = 24;
      iconImg.height = 24;
      iconImg.alt = '';

      const rarity = document.createElement('span');
      rarity.className = 'home-inventory__card-rarity';
      rarity.textContent = def.rarity;

      card.append(iconImg, rarity);
      card.addEventListener('click', () => openDetail(itemId));
      grid.appendChild(card);
    }
  };

  const onEquipmentChanged = (): void => {
    refresh();
  };

  const unsubscribeEquipment = EventBus.on('equipment:changed', onEquipmentChanged);

  refresh();

  return {
    root,
    refresh,
    destroy() {
      closeDetail();
      unsubscribeEquipment();
      root.remove();
    },
  };
}
