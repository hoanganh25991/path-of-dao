import { describe, expect, it } from 'vitest';
import {
  difficultyTierLabelKey,
  getDifficultyTier,
} from '@/ui/components/DifficultyBadge';

describe('getDifficultyTier', () => {
  it('returns trivial at ratio >= 1.5', () => {
    expect(getDifficultyTier(1500, 1000)).toBe('trivial');
    expect(getDifficultyTier(1500, 1000)).toBe('trivial');
  });

  it('returns balanced between 1.0 and 1.5', () => {
    expect(getDifficultyTier(1200, 1000)).toBe('balanced');
    expect(getDifficultyTier(1000, 1000)).toBe('balanced');
  });

  it('returns challenging between 0.7 and 1.0', () => {
    expect(getDifficultyTier(800, 1000)).toBe('challenging');
    expect(getDifficultyTier(700, 1000)).toBe('challenging');
  });

  it('returns hard between 0.5 and 0.7', () => {
    expect(getDifficultyTier(600, 1000)).toBe('hard');
    expect(getDifficultyTier(500, 1000)).toBe('hard');
  });

  it('returns deadly below 0.5', () => {
    expect(getDifficultyTier(400, 1000)).toBe('deadly');
    expect(getDifficultyTier(0, 1000)).toBe('deadly');
  });

  it('defaults to balanced when map CP is zero', () => {
    expect(getDifficultyTier(1000, 0)).toBe('balanced');
  });
});

describe('difficultyTierLabelKey', () => {
  it('maps tier to locale key', () => {
    expect(difficultyTierLabelKey('deadly')).toBe('difficulty.deadly');
  });
});
