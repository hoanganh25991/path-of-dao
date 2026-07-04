/**
 * Keep canvas CSS filling #game-shell.
 * Phaser Scale.NONE may set fixed px width/height or centering margins that
 * override `.game-canvas { width: 100%; height: 100% }` and leave dead space.
 */
export function syncGameCanvasDisplay(canvas: HTMLCanvasElement): void {
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.marginLeft = '';
  canvas.style.marginTop = '';
}
