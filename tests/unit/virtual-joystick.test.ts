/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  JOYSTICK_CLAMP_RADIUS_PX,
  JOYSTICK_DEADZONE,
  normalizeJoystick,
  VirtualJoystick,
} from '@/core/input/VirtualJoystick';

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

  it('inverts screen Y so up on stick is negative game Y', () => {
    const result = normalizeJoystick(0, -JOYSTICK_CLAMP_RADIUS_PX, JOYSTICK_CLAMP_RADIUS_PX);
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
});
