/**
 * DA-04 — procedural 24×24 Divine Art wheel icons (plans/design-arts/wheel-icons.md).
 *
 * Ships a readable placeholder icon per `skill.*`, generated from the skill's
 * Master Intent hue (handbook/pixel-art-style.md §3.1, canon values reused via
 * `@/shared/intentColors`) + a simple pixel-grid glyph — no PNG authoring
 * required. Rendered as an inline SVG data URL so it needs no `<canvas>`/DOM
 * (crisp in both the browser and this repo's node-environment unit tests).
 *
 * Resolution order matches `AssetArtRegistry` (DA-08): an authored
 * `assets/sprites/skills/{skillId}.png` (direct file or manifest override)
 * always wins; this module is only the fallback layer.
 */
import type { InsightIntentId } from '@/progression/SkillDefinition';
import { getSkillDefinition } from '@/progression/SkillLoader';
import { INTENT_RIM_COLORS } from '@/shared/intentColors';
import {
  resolveAssetUrl,
  resolveIconAsset,
  type AssetResolution,
} from '@/combat/art/AssetArtRegistry';

export type SkillIntentGlyph = 'slash' | 'petal' | 'bolt' | 'hourglass' | 'leaf' | 'eye' | 'dot';

const BASIC_HUE = '#585050';

/** Master Intent → simple glyph shape (DA-04 rule: "not letters"). */
const GLYPH_BY_INTENT: Record<InsightIntentId, SkillIntentGlyph> = {
  sword: 'slash',
  flame: 'petal',
  lightning: 'bolt',
  cause_effect: 'hourglass',
  life_death: 'leaf',
  truth_falsehood: 'eye',
  basic: 'dot',
};

/** 8×8 pixel grids (scaled 3× → 24×24) — chunky, unambiguous silhouettes. */
const GLYPH_GRIDS: Record<SkillIntentGlyph, readonly string[]> = {
  slash: ['00000001', '00000011', '00000110', '00001100', '00011000', '00110000', '01100000', '10000000'],
  petal: ['00011000', '00111100', '01111110', '01111110', '00111100', '00111100', '00011000', '00011000'],
  bolt: ['00011000', '00110000', '01100000', '11111100', '00011000', '00110000', '01100000', '11000000'],
  hourglass: ['11111111', '01111110', '00111100', '00011000', '00011000', '00111100', '01111110', '11111111'],
  leaf: ['00011000', '00111100', '01111110', '11111111', '11111111', '01111110', '00111100', '00011000'],
  eye: ['00000000', '00111100', '01111110', '11100111', '11100111', '01111110', '00111100', '00000000'],
  dot: ['00000000', '00011000', '00111100', '01111110', '01111110', '00111100', '00011000', '00000000'],
};

const GRID_SIZE = 8;
const CELL_PX = 3; // 8 * 3 = 24
const ICON_PX = GRID_SIZE * CELL_PX;

export function intentIconGlyph(intent: InsightIntentId): SkillIntentGlyph {
  return GLYPH_BY_INTENT[intent] ?? GLYPH_BY_INTENT.basic;
}

/** Base rim hue for an Intent (handbook §3.1 canon, reused from `intentColors`). */
export function intentIconHue(intent: InsightIntentId): string {
  if (intent === 'basic') return BASIC_HUE;
  return INTENT_RIM_COLORS[intent] ?? BASIC_HUE;
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Mix a `#rrggbb` hex color toward white by `amount` (0..1) — used for the awakened glow step. */
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
 * Build the raw SVG markup for an Intent's placeholder icon.
 * DA-04 rule: awakened never changes hue, just pushes brightness +1 step.
 */
export function buildSkillIconSvg(intent: InsightIntentId, awakened = false): string {
  const hue = intentIconHue(intent);
  const bg = awakened ? lighten(hue, 0.18) : hue;
  const glyphColor = lighten(hue, awakened ? 0.82 : 0.6);
  const grid = GLYPH_GRIDS[intentIconGlyph(intent)];

  const rim = awakened
    ? `<rect x="0.75" y="0.75" width="${ICON_PX - 1.5}" height="${ICON_PX - 1.5}" rx="4" fill="none" stroke="${glyphColor}" stroke-width="1.5" opacity="0.9"/>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_PX} ${ICON_PX}" width="${ICON_PX}" height="${ICON_PX}" shape-rendering="crispEdges">` +
    `<rect width="${ICON_PX}" height="${ICON_PX}" rx="4" fill="${bg}"/>` +
    glyphRects(grid, glyphColor) +
    rim +
    `</svg>`
  );
}

/** Data URL for an Intent's placeholder icon — cache key is `${intent}:${awakened}`. */
const proceduralIconCache = new Map<string, string>();

export function skillIconDataUrl(intent: InsightIntentId, awakened = false): string {
  const key = `${intent}:${awakened ? 1 : 0}`;
  const cached = proceduralIconCache.get(key);
  if (cached) return cached;

  const svg = buildSkillIconSvg(intent, awakened);
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  proceduralIconCache.set(key, dataUrl);
  return dataUrl;
}

/**
 * Pure resolver — mirrors `AssetArtRegistry`'s `*From` pattern: an explicit
 * resolution + resolved URL in, so PNG-preferred-over-procedural can be unit
 * tested without touching the filesystem/Vite glob.
 */
export function resolveSkillIconSrcFrom(
  resolution: AssetResolution,
  assetUrl: string | null,
  intent: InsightIntentId,
  awakened: boolean,
): string {
  if (resolution.source !== 'fallback' && assetUrl) {
    return assetUrl;
  }
  return skillIconDataUrl(intent, awakened);
}

function isAwakenedSkillId(skillId: string): boolean {
  return skillId.endsWith('.awakened');
}

function skillIntentOf(skillId: string): InsightIntentId {
  try {
    return getSkillDefinition(skillId).intent;
  } catch {
    return 'basic';
  }
}

/** Resolved icon `src` for a skillId — real PNG (DA-08) when authored, else the procedural placeholder. */
const skillIconSrcCache = new Map<string, string>();

export function getSkillIconSrc(skillId: string): string {
  if (!skillId) return skillIconDataUrl('basic');

  const cached = skillIconSrcCache.get(skillId);
  if (cached) return cached;

  const intent = skillIntentOf(skillId);
  const awakened = isAwakenedSkillId(skillId);
  const resolution = resolveIconAsset('skills', skillId);
  const assetUrl = resolveAssetUrl(resolution);
  const src = resolveSkillIconSrcFrom(resolution, assetUrl, intent, awakened);

  skillIconSrcCache.set(skillId, src);
  return src;
}

/** Test-only: reset caches so a skill/PNG-drop scenario can be re-resolved. */
export function clearSkillIconCache(): void {
  proceduralIconCache.clear();
  skillIconSrcCache.clear();
}
