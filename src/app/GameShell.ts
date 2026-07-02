export interface GameShellElements {
  gameShell: HTMLElement;
  canvas3d: HTMLCanvasElement;
  canvas2d: HTMLCanvasElement;
  uiRoot: HTMLElement;
  loadingOverlay: HTMLElement;
}

export class GameShell {
  static mount(root: HTMLElement): GameShellElements {
    root.innerHTML = `
      <div id="game-shell">
        <canvas id="canvas-3d" class="game-canvas"></canvas>
        <canvas id="canvas-2d" class="game-canvas canvas--inactive"></canvas>
      </div>
      <div id="ui-root"></div>
      <div id="loading-overlay" hidden aria-hidden="true"></div>
    `;

    const gameShell = root.querySelector<HTMLElement>('#game-shell');
    const canvas3d = root.querySelector<HTMLCanvasElement>('#canvas-3d');
    const canvas2d = root.querySelector<HTMLCanvasElement>('#canvas-2d');
    const uiRoot = root.querySelector<HTMLElement>('#ui-root');
    const loadingOverlay = root.querySelector<HTMLElement>('#loading-overlay');

    if (!gameShell || !canvas3d || !canvas2d || !uiRoot || !loadingOverlay) {
      throw new Error('GameShell: failed to mount required DOM elements');
    }

    return { gameShell, canvas3d, canvas2d, uiRoot, loadingOverlay };
  }

  static setActiveCanvas(elements: GameShellElements, scene: 'home' | 'combat' | 'story'): void {
    const use3d = scene === 'home';
    elements.canvas3d.classList.toggle('canvas--inactive', !use3d);
    elements.canvas2d.classList.toggle('canvas--inactive', use3d);
  }
}
