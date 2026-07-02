import { describe, expect, it } from 'vitest';
import {
  levelFromTotalXp,
  MAX_LEVEL,
  statsForLevel,
  xpForLevel,
} from '@/progression/LevelCurve';

describe('LevelCurve', () => {
  it('loads and validates content JSON (100 levels)', () => {
    expect(MAX_LEVEL).toBe(100);
  });

  it('xpForLevel returns positive XP for playable levels and 0 at cap', () => {
    expect(xpForLevel(1)).toBeGreaterThan(0);
    expect(xpForLevel(99)).toBeGreaterThan(xpForLevel(1));
    expect(xpForLevel(MAX_LEVEL)).toBe(0);
    expect(xpForLevel(0)).toBe(0);
  });

  it('levelFromTotalXp resolves accumulated XP', () => {
    expect(levelFromTotalXp(0)).toEqual({ level: 1, xpIntoLevel: 0 });

    const toLevel2 = xpForLevel(1);
    expect(levelFromTotalXp(toLevel2 - 1)).toEqual({ level: 1, xpIntoLevel: toLevel2 - 1 });
    expect(levelFromTotalXp(toLevel2)).toEqual({ level: 2, xpIntoLevel: 0 });
    expect(levelFromTotalXp(toLevel2 + 10)).toEqual({ level: 2, xpIntoLevel: 10 });
  });

  it('levelFromTotalXp caps at max level', () => {
    const result = levelFromTotalXp(Number.MAX_SAFE_INTEGER);
    expect(result.level).toBe(MAX_LEVEL);
    expect(result.xpIntoLevel).toBe(0);
  });

  it('statsForLevel returns growing stats for hero.wanderer', () => {
    const l1 = statsForLevel('hero.wanderer', 1);
    const l10 = statsForLevel('hero.wanderer', 10);
    const l50 = statsForLevel('hero.wanderer', 50);

    expect(l1.hpMax).toBe(100);
    expect(l1.atk).toBe(10);
    expect(l1.def).toBe(5);

    expect(l10.hpMax).toBeGreaterThan(l1.hpMax);
    expect(l50.atk).toBeGreaterThan(l10.atk);
    expect(l50.def).toBeGreaterThan(l10.def);
  });

  it('statsForLevel clamps out-of-range levels', () => {
    expect(statsForLevel('hero.wanderer', 0).level).toBe(1);
    expect(statsForLevel('hero.wanderer', 9999).level).toBe(MAX_LEVEL);
  });

  it('statsForLevel throws for unknown hero', () => {
    expect(() => statsForLevel('hero.unknown', 1)).toThrow(/unknown hero/);
  });
});
