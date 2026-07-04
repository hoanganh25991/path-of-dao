/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import {
  WORLD_MAP_DEFAULT_FOCUS_SCALE,
  WORLD_MAP_MAX_SCALE,
  WORLD_MAP_MIN_SCALE,
  centerPanOnPoint,
  clampPan,
  clampScale,
  createWorldMapViewport,
  getMapNodeWorldPosition,
  zoomAtViewportPoint,
} from '@/ui/world/WorldMapViewport';

describe('WorldMapViewport math', () => {
  it('clamps scale within min/max bounds', () => {
    expect(clampScale(0.1)).toBe(WORLD_MAP_MIN_SCALE);
    expect(clampScale(5)).toBe(WORLD_MAP_MAX_SCALE);
    expect(clampScale(1)).toBe(1);
  });

  it('centers a map point in the viewport', () => {
    const pan = centerPanOnPoint({ x: 200, y: 400 }, 1, 320, 480);
    expect(pan.x).toBe(320 / 2 - 200);
    expect(pan.y).toBe(480 / 2 - 400);
  });

  it('keeps zoom focal point stable when wheel zooming', () => {
    const pan = { x: 10, y: 20 };
    const scale = 1;
    const focal = { x: 100, y: 120 };
    const nextPan = zoomAtViewportPoint(pan, scale, focal, 1.5);
    const worldX = (focal.x - pan.x) / scale;
    const worldY = (focal.y - pan.y) / scale;
    expect(nextPan.x).toBeCloseTo(focal.x - worldX * 1.5);
    expect(nextPan.y).toBeCloseTo(focal.y - worldY * 1.5);
  });

  it('clamps pan when map is larger than viewport', () => {
    const pan = clampPan({ x: 500, y: 500 }, 1.5, 300, 400, 920, 1320);
    expect(pan.x).toBeLessThanOrEqual(48);
    expect(pan.y).toBeLessThanOrEqual(48);
  });

  it('centers map when scaled map fits inside viewport', () => {
    const pan = clampPan({ x: -200, y: -200 }, 0.2, 400, 600, 920, 1320);
    expect(pan.x).toBeCloseTo((400 - 920 * 0.2) / 2);
    expect(pan.y).toBeCloseTo((600 - 1320 * 0.2) / 2);
  });
});

describe('getMapNodeWorldPosition', () => {
  it('returns region + node coordinates for known map', () => {
    const point = getMapNodeWorldPosition('map.fallen_village.01');
    expect(point).toEqual({ x: 620 + 16, y: 1540 + 16 });
  });
});

describe('createWorldMapViewport', () => {
  it('initializes transform centered on focus point', () => {
    const viewport = document.createElement('div');
    Object.defineProperty(viewport, 'clientWidth', { value: 360, configurable: true });
    Object.defineProperty(viewport, 'clientHeight', { value: 640, configurable: true });

    const canvas = document.createElement('div');
    viewport.append(canvas);

    const focus = { x: 156, y: 1156 };
    const controller = createWorldMapViewport({
      viewport,
      canvas,
      mapWidth: 920,
      mapHeight: 1320,
      focusPoint: focus,
    });

    const raw = centerPanOnPoint(focus, WORLD_MAP_DEFAULT_FOCUS_SCALE, 360, 640);
    const expected = clampPan(raw, WORLD_MAP_DEFAULT_FOCUS_SCALE, 360, 640, 920, 1320);
    expect(canvas.style.transform).toContain(`translate(${expected.x}px, ${expected.y}px)`);
    expect(canvas.style.transform).toContain(`scale(${WORLD_MAP_DEFAULT_FOCUS_SCALE})`);

    controller.centerOn(focus);
    expect(canvas.style.transform).toContain(`translate(${expected.x}px, ${expected.y}px)`);

    controller.destroy();
  });
});
