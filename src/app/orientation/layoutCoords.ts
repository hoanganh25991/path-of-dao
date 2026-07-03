/** True when the physical viewport is taller than wide. */
export function isPortraitViewport(width: number, height: number): boolean {
  return height > width;
}

/** Landscape layout dimensions — swaps axes when the app is portrait-rotated. */
export function getLayoutDimensions(
  viewportWidth: number,
  viewportHeight: number,
  portraitRotate: boolean,
): { width: number; height: number } {
  if (!portraitRotate) {
    return { width: viewportWidth, height: viewportHeight };
  }
  return { width: viewportHeight, height: viewportWidth };
}

/**
 * Map viewport client coordinates into landscape layout space.
 * Used when the app is CSS-rotated 90° CW in a portrait viewport.
 */
export function clientToLayout(
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number,
  portraitRotate: boolean,
): { x: number; y: number } {
  if (!portraitRotate) {
    return { x: clientX, y: clientY };
  }

  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const layoutCx = viewportHeight / 2;
  const layoutCy = viewportWidth / 2;

  // Inverse of translate(-50%, -50%) rotate(90deg) around viewport center.
  return {
    x: layoutCx - dy,
    y: layoutCy + dx,
  };
}
