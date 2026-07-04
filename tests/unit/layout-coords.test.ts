import { describe, expect, it } from 'vitest';
import {
  clientToLayout,
  getLayoutDimensions,
  isPortraitViewport,
  pointerEventToLayout,
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

  it('uses full viewport on wide landscape desktop', () => {
    expect(getLayoutDimensions(1920, 1080, false)).toEqual({ width: 1920, height: 1080 });
  });

  it('maps pointer coords through HUD bounds in native landscape', () => {
    const hudRect = { left: 0, top: 0, width: 844, height: 390 } as DOMRect;
    expect(
      pointerEventToLayout(120, 80, hudRect, 844, 390, 844, 390, false),
    ).toEqual({ x: 120, y: 80 });
  });

  it('scales pointer coords when HUD bounds differ from layout size', () => {
    const hudRect = { left: 10, top: 20, width: 400, height: 200 } as DOMRect;
    const mapped = pointerEventToLayout(210, 120, hudRect, 844, 390, 844, 390, false);
    expect(mapped.x).toBeCloseTo(422, 0);
    expect(mapped.y).toBeCloseTo(195, 0);
  });
});
