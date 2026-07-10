/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InputManager } from '@/core/input/InputManager';

describe('InputManager button edge detection', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="hud"></div>';
    container = document.getElementById('hud')!;
    InputManager.resetForTests();
    InputManager.mount(container);
    InputManager.setEnabled(true);
  });

  afterEach(() => {
    InputManager.destroy();
    document.body.innerHTML = '';
  });

  it('sets pressed and held on first poll after button down', () => {
    const attackBtn = container.querySelector<HTMLButtonElement>('[data-action="attack"]')!;
    attackBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    const frame = InputManager.poll();
    expect(frame.state.attack.pressed).toBe(true);
    expect(frame.state.attack.held).toBe(true);
    expect(frame.state.attack.released).toBe(false);
  });

  it('clears pressed after consume unless a new press occurs', () => {
    const attackBtn = container.querySelector<HTMLButtonElement>('[data-action="attack"]')!;
    attackBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    InputManager.poll();
    const first = InputManager.consume();
    expect(first.attack.pressed).toBe(true);
    expect(first.attack.held).toBe(true);

    const secondFrame = InputManager.poll();
    expect(secondFrame.state.attack.pressed).toBe(false);
    expect(secondFrame.state.attack.held).toBe(true);

    attackBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    InputManager.poll();
    const released = InputManager.consume();
    expect(released.attack.released).toBe(true);
    expect(released.attack.held).toBe(false);
  });

  it('maps keyboard attack to pressed on poll', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));

    const frame = InputManager.poll();
    expect(frame.state.attack.pressed).toBe(true);
    expect(frame.state.attack.held).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
    InputManager.poll();
    const released = InputManager.consume();
    expect(released.attack.released).toBe(true);
    expect(released.attack.held).toBe(false);
  });
});
