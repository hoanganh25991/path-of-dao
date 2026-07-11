import { describe, expect, it, beforeEach } from 'vitest';
import type { ItemRarity } from '@/progression/ItemDefinition';
import { ITEM_RARITIES, ITEM_SLOTS } from '@/progression/ItemDefinition';
import {
  buildItemIconSvg,
  clearItemIconCache,
  getItemIconSrc,
  ITEM_RARITY_COLORS,
  itemIconDataUrl,
  itemIconGlyph,
  itemIconRimColor,
  lighten,
  resolveItemIconSrcFrom,
} from '@/combat/art/itemIconDraw';

beforeEach(() => {
  clearItemIconCache();
});

describe('itemIconDraw — slot glyph + rarity rim (DA-05)', () => {
  it('assigns a distinct simple glyph per equipment/consumable slot (not letters)', () => {
    const glyphs = new Set(ITEM_SLOTS.map((slot) => itemIconGlyph(slot)));
    expect(glyphs.size).toBe(ITEM_SLOTS.length);
  });

  it('reuses the canon rarity color map for every rarity tier', () => {
    for (const rarity of ITEM_RARITIES) {
      expect(itemIconRimColor(rarity)).toBe(ITEM_RARITY_COLORS[rarity]);
    }
  });

  it('falls back to the common rim color for an unrecognized rarity', () => {
    expect(itemIconRimColor('nonexistent' as ItemRarity)).toBe(ITEM_RARITY_COLORS.common);
  });
});

describe('itemIconDraw — lighten()', () => {
  it('mixes fully toward white at amount=1', () => {
    expect(lighten('#000000', 1)).toBe('#ffffff');
  });

  it('is a no-op at amount=0', () => {
    expect(lighten('#204060', 0)).toBe('#204060');
  });
});

describe('itemIconDraw — buildItemIconSvg / itemIconDataUrl', () => {
  it('generates a readable 24×24 icon for every slot × rarity combo', () => {
    for (const slot of ITEM_SLOTS) {
      for (const rarity of ITEM_RARITIES) {
        const svg = buildItemIconSvg(slot, rarity);
        expect(svg).toContain('viewBox="0 0 24 24"');
        expect(svg).toContain(itemIconRimColor(rarity));
        expect(svg).toMatch(/<rect/);
      }
    }
  });

  it('keeps the same glyph shape across rarities for a given slot (category, not rarity, drives glyph)', () => {
    const common = buildItemIconSvg('weapon', 'common');
    const legendary = buildItemIconSvg('weapon', 'legendary');
    // Strip out the rim/glow rect colors (which legitimately differ) before comparing glyph geometry.
    const glyphOnly = (svg: string): string => svg.replace(/#[0-9a-f]{6}/gi, '#hue');
    expect(glyphOnly(common)).not.toBe(glyphOnly(legendary)); // brighter glyph fill still differs
    expect(common).toContain('viewBox="0 0 24 24"');
  });

  it('adds a soft outer glow for epic/legendary but not common/uncommon/rare', () => {
    const common = buildItemIconSvg('spirit', 'common');
    const legendary = buildItemIconSvg('spirit', 'legendary');
    expect(common).not.toContain('stroke-width="3"');
    expect(legendary).toContain('stroke-width="3"');
  });

  it('produces distinct glyph geometry per slot at the same rarity', () => {
    const svgs = ITEM_SLOTS.map((slot) => buildItemIconSvg(slot, 'rare'));
    expect(new Set(svgs).size).toBe(ITEM_SLOTS.length);
  });

  it('returns a data URL wrapping the SVG markup', () => {
    const url = itemIconDataUrl('weapon', 'legendary');
    expect(url.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(decodeURIComponent(url.replace('data:image/svg+xml;utf8,', ''))).toContain('<svg');
  });

  it('caches the data URL per slot+rarity combo', () => {
    const first = itemIconDataUrl('armor', 'rare');
    const second = itemIconDataUrl('armor', 'rare');
    expect(second).toBe(first);
  });
});

describe('itemIconDraw — resolveItemIconSrcFrom (PNG override, DA-08)', () => {
  it('prefers an authored PNG when the registry resolves one', () => {
    const src = resolveItemIconSrcFrom(
      { source: 'file', relPath: 'items/item.sword.ancient.png' },
      'https://cdn.example/items/item.sword.ancient.png',
      'weapon',
      'legendary',
    );
    expect(src).toBe('https://cdn.example/items/item.sword.ancient.png');
  });

  it('falls back to the procedural icon when the registry has no PNG', () => {
    const src = resolveItemIconSrcFrom({ source: 'fallback', relPath: null }, null, 'armor', 'common');
    expect(src).toBe(itemIconDataUrl('armor', 'common'));
  });

  it('falls back to the procedural icon when the resolution resolves but the URL is missing', () => {
    const src = resolveItemIconSrcFrom(
      { source: 'manifest', relPath: 'items/legacy.png' },
      null,
      'accessory',
      'rare',
    );
    expect(src).toBe(itemIconDataUrl('accessory', 'rare'));
  });
});

describe('itemIconDraw — getItemIconSrc (real item content)', () => {
  it('returns a procedural icon matching slot+rarity for real items while no authored PNGs exist', () => {
    expect(getItemIconSrc('item.sword.ancient')).toBe(itemIconDataUrl('weapon', 'epic'));
    expect(getItemIconSrc('item.robe.novice')).toBe(itemIconDataUrl('armor', 'common'));
    expect(getItemIconSrc('item.spirit.jade')).toBe(itemIconDataUrl('spirit', 'rare'));
  });

  it('falls back to the common consumable placeholder for unknown item ids without throwing', () => {
    expect(getItemIconSrc('item.does.not.exist')).toBe(itemIconDataUrl('consumable', 'common'));
  });

  it('returns the empty-slot placeholder for an empty itemId', () => {
    expect(getItemIconSrc('')).toBe(itemIconDataUrl('consumable', 'common'));
  });

  it('caches resolved src per itemId', () => {
    const first = getItemIconSrc('item.ring.speed');
    const second = getItemIconSrc('item.ring.speed');
    expect(second).toBe(first);
  });
});
