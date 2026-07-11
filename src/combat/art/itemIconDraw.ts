/**
 * DA-05 — procedural 24×24 Dharma Treasure icons (plans/design-arts/items/index.md).
 *
 * Ships a readable placeholder icon per `item.*`, generated from the item's
 * rarity (rim color) + a simple pixel-grid glyph by equipment category
 * (weapon/armor/accessory/spirit/consumable) — no PNG authoring required.
 * Rendered as an inline SVG data URL, mirroring `skillIconDraw.ts` (DA-04):
 * no `<canvas>`/DOM needed, crisp in both the browser and unit tests.
 *
 * Resolution order matches `AssetArtRegistry` (DA-08): an authored
 * `assets/sprites/items/{itemId}.png` (direct file or manifest override)
 * always wins; this module is only the fallback layer.
 */
import { getItemDefinition } from '@/progression/ItemLoader';
import type { ItemRarity, ItemSlot } from '@/progression/ItemDefinition';
import {
  resolveAssetUrl,
  resolveIconAsset,
  type AssetResolution,
} from '@/combat/art/AssetArtRegistry';

export type ItemSlotGlyph = 'blade' | 'shield' | 'ring' | 'orb' | 'vial';

/** Equipment/inventory slot → simple glyph shape (mirrors DA-04's "not letters" rule). */
const GLYPH_BY_SLOT: Record<ItemSlot, ItemSlotGlyph> = {
  weapon: 'blade',
  armor: 'shield',
  accessory: 'ring',
  spirit: 'orb',
  consumable: 'vial',
};

/** 8×8 pixel grids (scaled 3× → 24×24) — chunky, unambiguous silhouettes. */
const GLYPH_GRIDS: Record<ItemSlotGlyph, readonly string[]> = {
  blade: ['00011000', '00011000', '00011000', '00011000', '01111110', '00011000', '00011000', '00111100'],
  shield: ['01111110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'],
  ring: ['00000000', '00111100', '01100110', '11000011', '11000011', '01100110', '00111100', '00000000'],
  orb: ['00000000', '00111100', '01111110', '11111111', '11111111', '01111110', '00111100', '00000000'],
  vial: ['00011000', '00011000', '00111100', '01111110', '11111111', '11111111', '01111110', '00111100'],
};

/** Rarity → rim/accent hue (handbook canon; also the single source ProfilePanel/InventoryPanel reuse). */
export const ITEM_RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9d9d9d',
  uncommon: '#2dd4a8',
  rare: '#4da6ff',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

/** Higher rarities get a soft outer glow halo in addition to the crisp rim. */
const GLOW_RARITIES: ReadonlySet<ItemRarity> = new Set(['epic', 'legendary']);

const GRID_SIZE = 8;
const CELL_PX = 3; // 8 * 3 = 24
const ICON_PX = GRID_SIZE * CELL_PX;
const ICON_BG = '#20222a';

export function itemIconGlyph(slot: ItemSlot): ItemSlotGlyph {
  return GLYPH_BY_SLOT[slot] ?? GLYPH_BY_SLOT.consumable;
}

/** Rim hue for a rarity tier. */
export function itemIconRimColor(rarity: ItemRarity): string {
  return ITEM_RARITY_COLORS[rarity] ?? ITEM_RARITY_COLORS.common;
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Mix a `#rrggbb` hex color toward white by `amount` (0..1). */
export function lighten(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const value = m[1]!;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const mix = (channel: number): string =>
    clamp255(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

function glyphRects(grid: readonly string[], color: string): string {
  const rects: string[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]!;
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '1') {
        rects.push(
          `<rect x="${x * CELL_PX}" y="${y * CELL_PX}" width="${CELL_PX}" height="${CELL_PX}" fill="${color}"/>`,
        );
      }
    }
  }
  return rects.join('');
}

/**
 * Build the raw SVG markup for an item's placeholder icon.
 * DA-05 rule: rarity always drives the rim/glow color, category always drives the glyph shape.
 */
export function buildItemIconSvg(slot: ItemSlot, rarity: ItemRarity): string {
  const rim = itemIconRimColor(rarity);
  const glyphColor = lighten(rim, 0.55);
  const grid = GLYPH_GRIDS[itemIconGlyph(slot)];

  const glow = GLOW_RARITIES.has(rarity)
    ? `<rect x="0.5" y="0.5" width="${ICON_PX - 1}" height="${ICON_PX - 1}" rx="5" fill="none" stroke="${rim}" stroke-width="3" opacity="0.28"/>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_PX} ${ICON_PX}" width="${ICON_PX}" height="${ICON_PX}" shape-rendering="crispEdges">` +
    `<rect width="${ICON_PX}" height="${ICON_PX}" rx="4" fill="${ICON_BG}"/>` +
    glyphRects(grid, glyphColor) +
    glow +
    `<rect x="0.75" y="0.75" width="${ICON_PX - 1.5}" height="${ICON_PX - 1.5}" rx="4" fill="none" stroke="${rim}" stroke-width="1.5"/>` +
    `</svg>`
  );
}

/** Data URL for a slot+rarity's placeholder icon — cache key is `${slot}:${rarity}`. */
const proceduralIconCache = new Map<string, string>();

export function itemIconDataUrl(slot: ItemSlot, rarity: ItemRarity): string {
  const key = `${slot}:${rarity}`;
  const cached = proceduralIconCache.get(key);
  if (cached) return cached;

  const svg = buildItemIconSvg(slot, rarity);
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  proceduralIconCache.set(key, dataUrl);
  return dataUrl;
}

/**
 * Pure resolver — mirrors `AssetArtRegistry`'s `*From` pattern: an explicit
 * resolution + resolved URL in, so PNG-preferred-over-procedural can be unit
 * tested without touching the filesystem/Vite glob.
 */
export function resolveItemIconSrcFrom(
  resolution: AssetResolution,
  assetUrl: string | null,
  slot: ItemSlot,
  rarity: ItemRarity,
): string {
  if (resolution.source !== 'fallback' && assetUrl) {
    return assetUrl;
  }
  return itemIconDataUrl(slot, rarity);
}

function itemSlotOf(itemId: string): ItemSlot {
  try {
    return getItemDefinition(itemId).slot;
  } catch {
    return 'consumable';
  }
}

function itemRarityOf(itemId: string): ItemRarity {
  try {
    return getItemDefinition(itemId).rarity;
  } catch {
    return 'common';
  }
}

/** Resolved icon `src` for an itemId — real PNG (DA-08) when authored, else the procedural placeholder. */
const itemIconSrcCache = new Map<string, string>();

export function getItemIconSrc(itemId: string): string {
  if (!itemId) return itemIconDataUrl('consumable', 'common');

  const cached = itemIconSrcCache.get(itemId);
  if (cached) return cached;

  const slot = itemSlotOf(itemId);
  const rarity = itemRarityOf(itemId);
  const resolution = resolveIconAsset('items', itemId);
  const assetUrl = resolveAssetUrl(resolution);
  const src = resolveItemIconSrcFrom(resolution, assetUrl, slot, rarity);

  itemIconSrcCache.set(itemId, src);
  return src;
}

/** Test-only: reset caches so an item/PNG-drop scenario can be re-resolved. */
export function clearItemIconCache(): void {
  proceduralIconCache.clear();
  itemIconSrcCache.clear();
}
