import Phaser from 'phaser';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';
import type { Player } from '@/combat/entities/Player';
import { VFX_TEXTURE_KEYS } from '@/combat/art/pixelVfxDraw';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import { addInventoryItem } from '@/progression/InventoryManager';
import { getItemDefinition } from '@/progression/ItemLoader';
import type { ItemRarity } from '@/progression/ItemDefinition';
import type { ItemDrop } from '@/combat/systems/lootRoll';

const PICKUP_MAGNET_DELAY_MS = 500;
const PICKUP_MAGNET_RANGE = 60;
const PICKUP_MAGNET_SPEED = 280;
const PICKUP_COLLECT_RADIUS = 18;

const RARITY_TINT: Record<ItemRarity, number> = {
  common: 0xd8d0c0,
  uncommon: 0x88dd88,
  rare: 0xb090ff,
  epic: 0xffd060,
  legendary: 0xff9060,
};

interface GoldPickup {
  kind: 'gold';
  img: Phaser.GameObjects.Image;
  value: number;
  ageMs: number;
}

interface ItemPickup {
  kind: 'item';
  img: Phaser.GameObjects.Image;
  itemId: string;
  qty: number;
  ageMs: number;
}

type Pickup = GoldPickup | ItemPickup;

function scatterOffset(index: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / 5 + Math.random() * 0.4;
  const dist = 10 + index * 6;
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
}

function showLootToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'home-toast home-ui__interactive combat-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.addEventListener('animationend', () => toast.remove());
}

/** Magnet pickups for gold and rolled combat loot. */
export class CombatPickupController {
  private readonly pickups: Pickup[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
  ) {}

  spawnGold(x: number, y: number, value: number): void {
    const img = this.scene.add
      .image(x + (Math.random() * 16 - 8), y + (Math.random() * 16 - 8), TEXTURE_KEYS.coin)
      .setDepth(8);
    this.pickups.push({ kind: 'gold', img, value, ageMs: 0 });
  }

  spawnItems(x: number, y: number, drops: ItemDrop[]): void {
    drops.forEach((drop, index) => {
      const offset = scatterOffset(index);
      let tint = 0xffffff;
      try {
        tint = RARITY_TINT[getItemDefinition(drop.itemId).rarity];
      } catch {
        // unknown item — default tint
      }

      const img = this.scene.add
        .image(x + offset.x, y + offset.y, VFX_TEXTURE_KEYS.spark)
        .setTint(tint)
        .setScale(1.35)
        .setDepth(8);
      this.pickups.push({ kind: 'item', img, itemId: drop.itemId, qty: drop.qty, ageMs: 0 });
    });
  }

  update(dtMs: number): void {
    const alive = this.pickups.filter((pickup) => {
      pickup.ageMs += dtMs;
      if (pickup.ageMs < PICKUP_MAGNET_DELAY_MS) return true;

      const dist = Phaser.Math.Distance.Between(
        pickup.img.x,
        pickup.img.y,
        this.player.x,
        this.player.y,
      );

      if (dist <= PICKUP_COLLECT_RADIUS) {
        if (pickup.kind === 'gold') {
          this.collectGold(pickup.value);
        } else {
          this.collectItem(pickup.itemId, pickup.qty);
        }
        pickup.img.destroy();
        return false;
      }

      if (dist <= PICKUP_MAGNET_RANGE) {
        const step = (PICKUP_MAGNET_SPEED * dtMs) / 1000;
        const angle = Math.atan2(this.player.y - pickup.img.y, this.player.x - pickup.img.x);
        pickup.img.x += Math.cos(angle) * step;
        pickup.img.y += Math.sin(angle) * step;
      }
      return true;
    });

    this.pickups.length = 0;
    this.pickups.push(...alive);
  }

  destroy(): void {
    for (const pickup of this.pickups) {
      pickup.img.destroy();
    }
    this.pickups.length = 0;
  }

  private collectGold(value: number): void {
    const store = gameStore.getState();
    if (!store.save) return;
    store.patch((current) => ({
      inventory: { ...current.inventory, gold: current.inventory.gold + value },
    }));
    AudioDirector.playLootPickup();
  }

  private collectItem(itemId: string, qty: number): void {
    const store = gameStore.getState();
    if (!store.save) return;
    store.patch((current) => ({
      inventory: {
        ...current.inventory,
        items: addInventoryItem(current.inventory.items, itemId, qty),
      },
    }));
    AudioDirector.playLootPickup();

    try {
      const name = I18nManager.t(getItemDefinition(itemId).displayNameKey);
      showLootToast(I18nManager.t('combat.loot.item', { name, qty }));
    } catch {
      showLootToast(I18nManager.t('combat.loot.item_unknown', { qty }));
    }
  }
}
