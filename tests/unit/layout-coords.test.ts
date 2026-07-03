import { describe, expect, it } from 'vitest';
import {
  clientToLayout,
  getLayoutDimensions,
  isPortraitViewport,
} from '@/app/orientation/layoutCoords';

describe('layoutCoords', () => {
  it('detects portrait viewport', () => {
    expect(isPortraitViewport(390, 844)).toBe(true);
    expect(isPortraitViewport(844, 390)).toBe(false);
    expect(isPortraitViewport(800, 800)).toBe(false);
  });

  it('swaps layout dimensions when portrait-rotated', () => {
    expect(getLayoutDimensions(390, 844, true)).toEqual({ width: 844, height: 390 });
    expect(getLayoutDimensions(844, 390, false)).toEqual({ width: 844, height: 390 });
  });

  it('maps viewport center to layout center when portrait-rotated', () => {
    const mapped = clientToLayout(195, 422, 390, 844, true);
    expect(mapped.x).toBeCloseTo(422, 0);
    expect(mapped.y).toBeCloseTo(195, 0);
  });

  it('passes through coords when not portrait-rotated', () => {
    expect(clientToLayout(120, 80, 844, 390, false)).toEqual({ x: 120, y: 80 });
  });
});
