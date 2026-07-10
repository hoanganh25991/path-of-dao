/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { OrientationManager } from '@/app/OrientationManager';
import {
  JOYSTICK_BASE_RADIUS_PX,
  JOYSTICK_CLAMP_RADIUS_PX,
  JOYSTICK_DEADZONE,
  getJoystickAnchor,
  normalizeJoystick,
  VirtualJoystick,
} from '@/core/input/VirtualJoystick';

describe('getJoystickAnchor', () => {
  it('insets far enough that full clamp drag clears the screen edge', () => {
    const height = 390;
    const anchor = getJoystickAnchor(844, height);
    expect(anchor.x).toBeGreaterThanOrEqual(JOYSTICK_CLAMP_RADIUS_PX + 20);
    expect(anchor.y).toBeLessThanOrEqual(height - JOYSTICK_CLAMP_RADIUS_PX - 20);
    expect(JOYSTICK_CLAMP_RADIUS_PX).toBe(JOYSTICK_BASE_RADIUS_PX);
  });
});

describe('normalizeJoystick', () => {
  it('returns zero vector at center touch', () => {
    expect(normalizeJoystick(0, 0, JOYSTICK_CLAMP_RADIUS_PX)).toEqual({ x: 0, y: 0 });
  });

  it('returns zero vector below deadzone', () => {
    const belowDeadzone = JOYSTICK_DEADZONE * JOYSTICK_CLAMP_RADIUS_PX * 0.5;
    expect(normalizeJoystick(belowDeadzone, 0, JOYSTICK_CLAMP_RADIUS_PX)).toEqual({ x: 0, y: 0 });
  });

  it('reaches magnitude 1 at clamp radius edge', () => {
    const result = normalizeJoystick(JOYSTICK_CLAMP_RADIUS_PX, 0, JOYSTICK_CLAMP_RADIUS_PX);
    expect(result.x).toBeCloseTo(1, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it('maps screen up to negative game Y (matches keyboard W)', () => {
    const result = normalizeJoystick(0, -JOYSTICK_CLAMP_RADIUS_PX, JOYSTICK_CLAMP_RADIUS_PX);
    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(-1, 5);
  });

  it('maps screen down to positive game Y (matches keyboard S)', () => {
    const result = normalizeJoystick(0, JOYSTICK_CLAMP_RADIUS_PX, JOYSTICK_CLAMP_RADIUS_PX);
    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(1, 5);
  });

  it('clamps vectors beyond max radius', () => {
    const result = normalizeJoystick(JOYSTICK_CLAMP_RADIUS_PX * 2, 0, JOYSTICK_CLAMP_RADIUS_PX);
    expect(result.x).toBeCloseTo(1, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });
});

describe('VirtualJoystick', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="hud"></div>';
    container = document.getElementById('hud')!;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('tracks move vector from simulated touch', () => {
    const joystick = new VirtualJoystick(container);
    joystick.setEnabled(true);
    joystick.simulateTouch(100, 200);
    joystick.simulateTouch(100 + JOYSTICK_CLAMP_RADIUS_PX, 200);

    const move = joystick.getMoveVector();
    expect(move.x).toBeCloseTo(1, 5);
    expect(move.y).toBeCloseTo(0, 5);

    joystick.destroy();
  });

  it('clears move vector on release', () => {
    const joystick = new VirtualJoystick(container);
    joystick.setEnabled(true);
    joystick.simulateTouch(100, 200);
    joystick.simulateTouch(160, 200);
    joystick.simulateRelease();

    expect(joystick.getMoveVector()).toEqual({ x: 0, y: 0 });
    joystick.destroy();
  });

  it('accepts pointer input on the visible stick element', () => {
    const joystick = new VirtualJoystick(container);
    joystick.setEnabled(true);

    joystick.element.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: 68,
        clientY: 300,
        pointerId: 2,
        pointerType: 'touch',
      }),
    );
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        clientX: 148,
        clientY: 300,
        pointerId: 2,
        pointerType: 'touch',
      }),
    );

    expect(Math.hypot(joystick.getMoveVector().x, joystick.getMoveVector().y)).toBeGreaterThan(0.5);
    joystick.destroy();
  });

  it('accepts pointer input on the zone in portrait-rotated layout', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390, writable: true });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844, writable: true });
    OrientationManager.init();

    const joystick = new VirtualJoystick(container);
    joystick.setEnabled(true);

    const zone = joystick.zone;
    // Physical coords that map to layout x > 50% — rejected by the old half-screen filter.
    zone.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: 80,
        clientY: 200,
        pointerId: 1,
        pointerType: 'touch',
      }),
    );
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        clientX: 80,
        clientY: 350,
        pointerId: 1,
        pointerType: 'touch',
      }),
    );

    expect(Math.hypot(joystick.getMoveVector().x, joystick.getMoveVector().y)).toBeGreaterThan(0.5);

    joystick.destroy();
    EventBus.clear();
    OrientationManager.resetForTests();
    document.documentElement.className = '';
    document.documentElement.style.removeProperty('--layout-w');
    document.documentElement.style.removeProperty('--layout-h');
  });
});
