import type { Vec2 } from '@/core/input/InputState';

export const JOYSTICK_BASE_RADIUS_PX = 48;
export const JOYSTICK_CLAMP_RADIUS_PX = 60;
/** Normalized deadzone — magnitudes below this become zero. */
export const JOYSTICK_DEADZONE = 0.15;

/**
 * Normalize thumb offset to a game-space vector.
 * Screen Y is inverted so pushing the stick up yields negative y (forward in 2D maps).
 */
export function normalizeJoystick(
  dx: number,
  dy: number,
  maxRadius: number,
  deadzone = JOYSTICK_DEADZONE,
): Vec2 {
  const len = Math.hypot(dx, dy);
  const deadzonePx = deadzone * maxRadius;
  if (len < deadzonePx) return { x: 0, y: 0 };

  const clamped = Math.min(len, maxRadius) / maxRadius;
  return {
    x: (dx / len) * clamped,
    y: -(dy / len) * clamped,
  };
}

export class VirtualJoystick {
  readonly element: HTMLElement;
  /** Left-half touch capture area; the HUD container itself ignores pointer events. */
  readonly zone: HTMLElement;

  private baseEl: HTMLElement;
  private thumbEl: HTMLElement;
  private enabled = false;
  private activeTouchId: number | null = null;
  private centerX = 0;
  private centerY = 0;
  private moveVector: Vec2 = { x: 0, y: 0 };
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly onTouchStart = (event: TouchEvent): void => {
    if (!this.enabled || this.activeTouchId !== null) return;

    for (const touch of event.changedTouches) {
      if (touch.clientX > window.innerWidth * 0.5) continue;

      this.activeTouchId = touch.identifier;
      this.showAt(touch.clientX, touch.clientY);
      this.updateFromTouch(touch.clientX, touch.clientY);
      event.preventDefault();
      return;
    }
  };

  private readonly onTouchMove = (event: TouchEvent): void => {
    if (!this.enabled || this.activeTouchId === null) return;

    for (const touch of event.changedTouches) {
      if (touch.identifier !== this.activeTouchId) continue;
      this.updateFromTouch(touch.clientX, touch.clientY);
      event.preventDefault();
      return;
    }
  };

  private readonly onTouchEnd = (event: TouchEvent): void => {
    if (!this.enabled || this.activeTouchId === null) return;

    for (const touch of event.changedTouches) {
      if (touch.identifier !== this.activeTouchId) continue;
      this.release();
      event.preventDefault();
      return;
    }
  };

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.id = 'joystick';
    this.element.className = 'joystick hidden';

    this.baseEl = document.createElement('div');
    this.baseEl.className = 'joystick-base';

    this.thumbEl = document.createElement('div');
    this.thumbEl.className = 'joystick-thumb';

    this.element.append(this.baseEl, this.thumbEl);

    this.zone = document.createElement('div');
    this.zone.className = 'joystick-zone';
    this.zone.hidden = true;

    container.append(this.zone, this.element);

    this.zone.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.zone.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.zone.addEventListener('touchend', this.onTouchEnd, { passive: false });
    this.zone.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.zone.hidden = !enabled;
    if (!enabled) {
      this.release();
      this.hideImmediate();
    }
  }

  getMoveVector(): Vec2 {
    return { x: this.moveVector.x, y: this.moveVector.y };
  }

  /** For tests — simulate a touch without DOM events. */
  simulateTouch(clientX: number, clientY: number): void {
    if (this.activeTouchId === null) {
      this.activeTouchId = 0;
      this.showAt(clientX, clientY);
    }
    this.updateFromTouch(clientX, clientY);
  }

  /** For tests — simulate release. */
  simulateRelease(): void {
    this.release();
  }

  destroy(): void {
    if (this.fadeTimer !== null) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }

    this.zone.removeEventListener('touchstart', this.onTouchStart);
    this.zone.removeEventListener('touchmove', this.onTouchMove);
    this.zone.removeEventListener('touchend', this.onTouchEnd);
    this.zone.removeEventListener('touchcancel', this.onTouchEnd);
    this.zone.remove();
    this.element.remove();
  }

  private showAt(clientX: number, clientY: number): void {
    if (this.fadeTimer !== null) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }

    this.centerX = clientX;
    this.centerY = clientY;
    this.element.style.left = `${clientX}px`;
    this.element.style.top = `${clientY}px`;
    this.element.classList.remove('hidden', 'joystick--fading');
    this.element.classList.add('joystick--active');
    this.thumbEl.style.transform = 'translate(-50%, -50%)';
  }

  private updateFromTouch(clientX: number, clientY: number): void {
    const dx = clientX - this.centerX;
    const dy = clientY - this.centerY;
    this.moveVector = normalizeJoystick(dx, dy, JOYSTICK_CLAMP_RADIUS_PX);

    const clampedLen = Math.min(Math.hypot(dx, dy), JOYSTICK_CLAMP_RADIUS_PX);
    const angle = Math.atan2(dy, dx);
    const thumbX = Math.cos(angle) * clampedLen;
    const thumbY = Math.sin(angle) * clampedLen;
    this.thumbEl.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
  }

  private release(): void {
    this.activeTouchId = null;
    this.moveVector = { x: 0, y: 0 };
    this.thumbEl.style.transform = 'translate(-50%, -50%)';
    this.element.classList.remove('joystick--active');
    this.element.classList.add('joystick--fading');

    if (this.fadeTimer !== null) clearTimeout(this.fadeTimer);
    this.fadeTimer = setTimeout(() => {
      this.hideImmediate();
      this.fadeTimer = null;
    }, 300);
  }

  private hideImmediate(): void {
    this.element.classList.add('hidden');
    this.element.classList.remove('joystick--fading', 'joystick--active');
  }
}
