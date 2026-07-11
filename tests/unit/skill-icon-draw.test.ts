import { describe, expect, it, beforeEach } from 'vitest';
import type { InsightIntentId } from '@/progression/SkillDefinition';
import { INTENT_RIM_COLORS } from '@/shared/intentColors';
import {
  buildSkillIconSvg,
  clearSkillIconCache,
  getSkillIconSrc,
  intentIconGlyph,
  intentIconHue,
  lighten,
  resolveSkillIconSrcFrom,
  skillIconDataUrl,
} from '@/combat/art/skillIconDraw';

const CANON_INTENTS: Exclude<InsightIntentId, 'basic'>[] = [
  'life_death',
  'cause_effect',
  'truth_falsehood',
  'sword',
  'flame',
  'lightning',
];

beforeEach(() => {
  clearSkillIconCache();
});

describe('skillIconDraw — intent hue + glyph (DA-04)', () => {
  it('reuses the handbook-canon rim hue (intentColors.ts) for every Master Intent', () => {
    for (const intent of CANON_INTENTS) {
      expect(intentIconHue(intent)).toBe(INTENT_RIM_COLORS[intent]);
    }
  });

  it('falls back to a neutral hue for the non-canon "basic" intent', () => {
    expect(intentIconHue('basic')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('assigns a distinct simple glyph per intent (not letters)', () => {
    const glyphs = new Set(CANON_INTENTS.map((intent) => intentIconGlyph(intent)));
    expect(glyphs.size).toBe(CANON_INTENTS.length);
  });
});

describe('skillIconDraw — lighten()', () => {
  it('mixes fully toward white at amount=1', () => {
    expect(lighten('#000000', 1)).toBe('#ffffff');
  });

  it('is a no-op at amount=0', () => {
    expect(lighten('#204060', 0)).toBe('#204060');
  });
});

describe('skillIconDraw — buildSkillIconSvg / skillIconDataUrl', () => {
  it('generates a readable 24×24 icon for every canon intent', () => {
    for (const intent of CANON_INTENTS) {
      const svg = buildSkillIconSvg(intent);
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain(intentIconHue(intent));
      expect(svg).toMatch(/<rect/);
    }
  });

  it('pushes the same hue family brighter for the awakened step (no new hue)', () => {
    const svg = buildSkillIconSvg('flame', false);
    const awakenedSvg = buildSkillIconSvg('flame', true);
    expect(awakenedSvg).not.toBe(svg);
    // Awakened adds a rim stroke but never swaps to a different intent's hue.
    for (const other of CANON_INTENTS.filter((i) => i !== 'flame')) {
      expect(awakenedSvg).not.toContain(intentIconHue(other));
    }
  });

  it('returns a data URL wrapping the SVG markup', () => {
    const url = skillIconDataUrl('sword');
    expect(url.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(decodeURIComponent(url.replace('data:image/svg+xml;utf8,', ''))).toContain('<svg');
  });

  it('caches the data URL per intent+awakened combo', () => {
    const first = skillIconDataUrl('lightning', true);
    const second = skillIconDataUrl('lightning', true);
    expect(second).toBe(first);
  });
});

describe('skillIconDraw — resolveSkillIconSrcFrom (PNG override, DA-08)', () => {
  it('prefers an authored PNG when the registry resolves one', () => {
    const src = resolveSkillIconSrcFrom(
      { source: 'file', relPath: 'skills/skill.sword.flash.png' },
      'https://cdn.example/skills/skill.sword.flash.png',
      'sword',
      false,
    );
    expect(src).toBe('https://cdn.example/skills/skill.sword.flash.png');
  });

  it('falls back to the procedural icon when the registry has no PNG', () => {
    const src = resolveSkillIconSrcFrom({ source: 'fallback', relPath: null }, null, 'flame', false);
    expect(src).toBe(skillIconDataUrl('flame', false));
  });

  it('falls back to the procedural icon when the resolution resolves but the URL is missing', () => {
    const src = resolveSkillIconSrcFrom(
      { source: 'manifest', relPath: 'skills/legacy.png' },
      null,
      'lightning',
      true,
    );
    expect(src).toBe(skillIconDataUrl('lightning', true));
  });
});

describe('skillIconDraw — getSkillIconSrc (real skill content)', () => {
  it('returns a procedural icon for real skills while no authored PNGs exist', () => {
    expect(getSkillIconSrc('skill.sword.slash')).toBe(skillIconDataUrl('sword', false));
    expect(getSkillIconSrc('skill.flame.bolt')).toBe(skillIconDataUrl('flame', false));
  });

  it('recognizes the intent behind void-flavored skill ids (intent: truth_falsehood)', () => {
    expect(getSkillIconSrc('skill.void.slash')).toBe(skillIconDataUrl('truth_falsehood', false));
  });

  it('brightens (but keeps hue) for awakened skill ids', () => {
    expect(getSkillIconSrc('skill.sword.slash.awakened')).toBe(skillIconDataUrl('sword', true));
  });

  it('falls back to the "basic" placeholder for unknown skill ids without throwing', () => {
    expect(getSkillIconSrc('skill.does.not.exist')).toBe(skillIconDataUrl('basic', false));
  });

  it('returns the empty-slot placeholder for an empty skillId', () => {
    expect(getSkillIconSrc('')).toBe(skillIconDataUrl('basic'));
  });
});
