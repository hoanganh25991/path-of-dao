import type { Vec2 } from '@/core/input/InputState';
import { OrientationManager } from '@/app/OrientationManager';
import { pointerEventToLayout } from '@/app/orientation/layoutCoords';
import { EventBus } from '@/core/EventBus';

export const JOYSTICK_BASE_RADIUS_PX = 48;
export const JOYSTICK_CLAMP_RADIUS_PX = 80;
/** Normalized deadzone — magnitudes below this become zero. */
export const JOYSTICK_DEADZONE = 0.08;

const ANCHOR_INSET_PX = 20;

/** Bottom-left anchor in landscape layout space — matches combat-hud.css inset. */
export function getJoystickAnchor(_layoutWidth: number, layoutHeight: number): Vec2 {
  return {
    x: ANCHOR_INSET_PX + JOYSTICK_BASE_RADIUS_PX,
    y: layoutHeight - ANCHOR_INSET_PX - JOYSTICK_BASE_RADIUS_PX,
  };
}

/**
 * Normalize thumb offset to a game-space vector.
 * Matches keyboard: negative y is up, positive y is down.
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
    y: (dy / len) * clamped,
  };
}

export class VirtualJoystick {
  readonly element: HTMLElement;
  /** Left-half touch capture area; the HUD container itself ignores pointer events. */
  readonly zone: HTMLElement;

  private baseEl: HTMLElement;
  private thumbEl: HTMLElement;
  private readonly hudContainer: HTMLElement;
  private enabled = false;
  /** Active pointer or touch identifier — zone hit-testing already limits to the left side. */
  private activePointerId: number | null = null;
  private centerX = 0;
  private centerY = 0;
  private moveVector: Vec2 = { x: 0, y: 0 };
  private layoutUnsub: (() => void) | null = null;
  private captureEl: HTMLElement | null = null;
  private windowTracking = false;
  private readonly pointerTargets: HTMLElement[] = [];

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled || this.activePointerId !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    this.activePointerId = event.pointerId;
    this.captureEl = event.currentTarget as HTMLElement;
    this.captureEl.setPointerCapture?.(event.pointerId);
    this.bindWindowPointerTracking();
    this.snapToAnchor();

    this.applyPointerPosition(event);
    this.element.classList.add('joystick--active');
    event.preventDefault();
  };

  private readonly onWindowPointerMove = (event: PointerEvent): void => {
    if (!this.enabled || this.activePointerId !== event.pointerId) return;

    const events = event.getCoalescedEvents?.().length ? event.getCoalescedEvents() : [event];
    for (const coalesced of events) {
      this.applyPointerPosition(coalesced);
    }
    event.preventDefault();
  };

  private readonly onWindowPointerEnd = (event: PointerEvent): void => {
    if (!this.enabled || this.activePointerId !== event.pointerId) return;

    if (this.captureEl?.hasPointerCapture?.(event.pointerId)) {
      this.captureEl.releasePointerCapture?.(event.pointerId);
    }
    this.captureEl = null;
    this.unbindWindowPointerTracking();
    this.release();
    event.preventDefault();
  };

  constructor(container: HTMLElement) {
    this.hudContainer = container;

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

    this.bindPointerDown(this.zone);
    this.bindPointerDown(this.element);
  }

  private bindPointerDown(target: HTMLElement): void {
    target.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.pointerTargets.push(target);
  }

  private unbindPointerDown(): void {
    for (const target of this.pointerTargets) {
      target.removeEventListener('pointerdown', this.onPointerDown);
    }
    this.pointerTargets.length = 0;
  }

  private bindWindowPointerTracking(): void {
    if (this.windowTracking) return;
    this.windowTracking = true;
    window.addEventListener('pointermove', this.onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onWindowPointerEnd, { passive: false });
    window.addEventListener('pointercancel', this.onWindowPointerEnd, { passive: false });
  }

  private unbindWindowPointerTracking(): void {
    if (!this.windowTracking) return;
    this.windowTracking = false;
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onWindowPointerEnd);
    window.removeEventListener('pointercancel', this.onWindowPointerEnd);
  }

  private applyPointerPosition(event: Pick<PointerEvent, 'clientX' | 'clientY'>): void {
    const { width, height } = OrientationManager.getLayoutSize();
    const { x, y } = pointerEventToLayout(
      event.clientX,
      event.clientY,
      this.hudContainer.getBoundingClientRect(),
      window.innerWidth,
      window.innerHeight,
      width,
      height,
      OrientationManager.isPortraitRotateActive(),
    );
    this.updateFromTouch(x, y);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.zone.hidden = !enabled;

    if (enabled) {
      this.layoutUnsub = EventBus.on('layout:changed', () => {
        if (this.activePointerId === null) this.snapToAnchor();
      });
      this.snapToAnchor();
      this.element.classList.remove('hidden');
      return;
    }

    this.layoutUnsub?.();
    this.layoutUnsub = null;
    this.release();
    this.hideImmediate();
  }

  getMoveVector(): Vec2 {
    return { x: this.moveVector.x, y: this.moveVector.y };
  }

  /** For tests — simulate a touch without DOM events. */
  simulateTouch(clientX: number, clientY: number): void {
    if (this.activePointerId === null) {
      this.activePointerId = 0;
      this.showAt(clientX, clientY);
    }
    this.updateFromTouch(clientX, clientY);
  }

  /** For tests — simulate release. */
  simulateRelease(): void {
    this.release();
  }

  destroy(): void {
    this.layoutUnsub?.();
    this.layoutUnsub = null;

    this.unbindWindowPointerTracking();
    this.unbindPointerDown();
    this.zone.remove();
    this.element.remove();
  }

  private snapToAnchor(): void {
    const { width, height } = OrientationManager.getLayoutSize();
    if (width <= 0 || height <= 0) return;
    const anchor = getJoystickAnchor(width, height);
    this.showAt(anchor.x, anchor.y);
  }

  private showAt(layoutX: number, layoutY: number): void {
    this.centerX = layoutX;
    this.centerY = layoutY;
    this.element.style.left = `${layoutX}px`;
    this.element.style.top = `${layoutY}px`;
    this.thumbEl.style.transform = 'translate(-50%, -50%)';
  }

  private updateFromTouch(layoutX: number, layoutY: number): void {
    const dx = layoutX - this.centerX;
    const dy = layoutY - this.centerY;
    const dist = Math.hypot(dx, dy);

    this.moveVector = normalizeJoystick(dx, dy, JOYSTICK_CLAMP_RADIUS_PX);

    const clampedLen = Math.min(dist, JOYSTICK_CLAMP_RADIUS_PX);
    const angle = Math.atan2(dy, dx);
    const thumbX = Math.cos(angle) * clampedLen;
    const thumbY = Math.sin(angle) * clampedLen;
    this.thumbEl.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
  }

  private release(): void {
    if (this.captureEl && this.activePointerId !== null) {
      this.captureEl.releasePointerCapture?.(this.activePointerId);
    }
    this.captureEl = null;
    this.unbindWindowPointerTracking();
    this.activePointerId = null;
    this.moveVector = { x: 0, y: 0 };
    this.element.classList.remove('joystick--active');
    this.snapToAnchor();
  }

  private hideImmediate(): void {
    this.element.classList.add('hidden');
    this.element.classList.remove('joystick--active');
  }
}
