import { findWorldMapNode } from '@/progression/WorldMapLoader';

export interface Point2D {
  x: number;
  y: number;
}

export interface WorldMapViewportOptions {
  viewport: HTMLElement;
  canvas: HTMLElement;
  mapWidth: number;
  mapHeight: number;
  /** Map-space coordinates to center on open (defaults to map center). */
  focusPoint?: Point2D;
  onLocate?: () => void;
}

export interface WorldMapViewportController {
  centerOn(point: Point2D, scale?: number): void;
  destroy(): void;
}

export const WORLD_MAP_MIN_SCALE = 0.55;
export const WORLD_MAP_MAX_SCALE = 2.4;
export const WORLD_MAP_DEFAULT_FOCUS_SCALE = 1.15;
export const WORLD_MAP_DRAG_THRESHOLD_PX = 6;

/** Pin center in map space (matches connection-path anchor offset). */
export function getMapNodeWorldPosition(mapId: string): Point2D | null {
  const located = findWorldMapNode(mapId);
  if (!located) return null;
  return {
    x: located.region.position.x + located.node.position.x + 16,
    y: located.region.position.y + located.node.position.y + 16,
  };
}

export function clampScale(scale: number): number {
  return Math.min(WORLD_MAP_MAX_SCALE, Math.max(WORLD_MAP_MIN_SCALE, scale));
}

export function centerPanOnPoint(
  point: Point2D,
  scale: number,
  viewportWidth: number,
  viewportHeight: number,
): Point2D {
  return {
    x: viewportWidth / 2 - point.x * scale,
    y: viewportHeight / 2 - point.y * scale,
  };
}

export function clampPan(
  pan: Point2D,
  scale: number,
  viewportWidth: number,
  viewportHeight: number,
  mapWidth: number,
  mapHeight: number,
): Point2D {
  const scaledW = mapWidth * scale;
  const scaledH = mapHeight * scale;
  const margin = 48;

  let minX: number;
  let maxX: number;
  if (scaledW <= viewportWidth) {
    minX = maxX = (viewportWidth - scaledW) / 2;
  } else {
    minX = viewportWidth - scaledW - margin;
    maxX = margin;
  }

  let minY: number;
  let maxY: number;
  if (scaledH <= viewportHeight) {
    minY = maxY = (viewportHeight - scaledH) / 2;
  } else {
    minY = viewportHeight - scaledH - margin;
    maxY = margin;
  }

  return {
    x: Math.min(maxX, Math.max(minX, pan.x)),
    y: Math.min(maxY, Math.max(minY, pan.y)),
  };
}

export function zoomAtViewportPoint(
  pan: Point2D,
  scale: number,
  focal: Point2D,
  nextScale: number,
): Point2D {
  const clamped = clampScale(nextScale);
  const worldX = (focal.x - pan.x) / scale;
  const worldY = (focal.y - pan.y) / scale;
  return {
    x: focal.x - worldX * clamped,
    y: focal.y - worldY * clamped,
  };
}

function applyTransform(canvas: HTMLElement, pan: Point2D, scale: number): void {
  canvas.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;
  canvas.style.transformOrigin = '0 0';
}

export function createWorldMapViewport(options: WorldMapViewportOptions): WorldMapViewportController {
  const { viewport, canvas, mapWidth, mapHeight } = options;

  let scale = WORLD_MAP_DEFAULT_FOCUS_SCALE;
  let pan: Point2D = { x: 0, y: 0 };

  const getViewportSize = (): { width: number; height: number } => ({
    width: viewport.clientWidth,
    height: viewport.clientHeight,
  });

  const apply = (): void => {
    const { width, height } = getViewportSize();
    pan = clampPan(pan, scale, width, height, mapWidth, mapHeight);
    applyTransform(canvas, pan, scale);
  };

  const centerOn = (point: Point2D, nextScale = scale): void => {
    scale = clampScale(nextScale);
    const { width, height } = getViewportSize();
    pan = centerPanOnPoint(point, scale, width, height);
    apply();
  };

  const focus = options.focusPoint ?? { x: mapWidth / 2, y: mapHeight / 2 };
  centerOn(focus, WORLD_MAP_DEFAULT_FOCUS_SCALE);

  let activePointerId: number | null = null;
  let dragStart: Point2D | null = null;
  let panStart: Point2D | null = null;
  let didDrag = false;
  let lastPinchDist = 0;
  let pinchMidpoint: Point2D | null = null;

  const viewportRect = (): DOMRect => viewport.getBoundingClientRect();

  const toViewportPoint = (clientX: number, clientY: number): Point2D => {
    const rect = viewportRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const shouldIgnorePanStart = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest('.world-map-node')
        || target.closest('.world-map-overlay__close')
        || target.closest('.world-map-overlay__locate'),
    );
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (shouldIgnorePanStart(event.target)) return;

    activePointerId = event.pointerId;
    dragStart = { x: event.clientX, y: event.clientY };
    panStart = { ...pan };
    didDrag = false;
    viewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (activePointerId !== event.pointerId || !dragStart || !panStart) return;

    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (!didDrag && Math.hypot(dx, dy) < WORLD_MAP_DRAG_THRESHOLD_PX) return;

    didDrag = true;
    pan = { x: panStart.x + dx, y: panStart.y + dy };
    apply();
    event.preventDefault();
  };

  const endPointer = (event: PointerEvent): void => {
    if (activePointerId !== event.pointerId) return;

    if (didDrag) {
      canvas.dataset.suppressClick = '1';
      window.setTimeout(() => {
        delete canvas.dataset.suppressClick;
      }, 0);
    }

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    activePointerId = null;
    dragStart = null;
    panStart = null;
  };

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const focal = toViewportPoint(event.clientX, event.clientY);
    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    const nextScale = clampScale(scale + delta);
    pan = zoomAtViewportPoint(pan, scale, focal, nextScale);
    scale = nextScale;
    apply();
  };

  const onTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0]!, event.touches[1]!];
      lastPinchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchMidpoint = {
        x: (a.clientX + b.clientX) / 2,
        y: (a.clientY + b.clientY) / 2,
      };
    }
  };

  const onTouchMove = (event: TouchEvent): void => {
    if (event.touches.length !== 2 || lastPinchDist <= 0 || !pinchMidpoint) return;
    event.preventDefault();

    const [a, b] = [event.touches[0]!, event.touches[1]!];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const delta = (dist - lastPinchDist) * 0.005;
    const focal = toViewportPoint(pinchMidpoint.x, pinchMidpoint.y);
    const nextScale = clampScale(scale + delta);
    pan = zoomAtViewportPoint(pan, scale, focal, nextScale);
    scale = nextScale;
    lastPinchDist = dist;
    apply();
  };

  const onTouchEnd = (event: TouchEvent): void => {
    if (event.touches.length < 2) {
      lastPinchDist = 0;
      pinchMidpoint = null;
    }
  };

  const onClickCapture = (event: MouseEvent): void => {
    if (canvas.dataset.suppressClick === '1') {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const onResize = (): void => {
    apply();
  };

  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);
  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('touchstart', onTouchStart, { passive: true });
  viewport.addEventListener('touchmove', onTouchMove, { passive: false });
  viewport.addEventListener('touchend', onTouchEnd);
  viewport.addEventListener('touchcancel', onTouchEnd);
  canvas.addEventListener('click', onClickCapture, true);
  window.addEventListener('resize', onResize);

  return {
    centerOn,
    destroy: () => {
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', endPointer);
      viewport.removeEventListener('pointercancel', endPointer);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('touchcancel', onTouchEnd);
      canvas.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('resize', onResize);
    },
  };
}
