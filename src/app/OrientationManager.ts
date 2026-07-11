import type { SceneId } from '@/app/SceneId';
import { RotatePrompt } from '@/app/RotatePrompt';
import { EventBus } from '@/core/EventBus';
import { GameClock } from '@/core/GameClock';
import { SceneRouter } from '@/app/SceneRouter';
import {
  clientToLayout,
  getLayoutDimensions,
  isPortraitViewport,
} from '@/app/orientation/layoutCoords';
import { syncGameCanvasDisplay } from '@/app/orientation/syncGameCanvasDisplay';

const NEEDS_LANDSCAPE_CLASS = 'needs-landscape';
const LAYOUT_CLASS = 'landscape-layout';
const SCENE_CLASS_PREFIX = 'scene-';

/**
 * Landscape-first layout + combat orientation lock.
 * Portrait phones get a rotate prompt (no CSS sideways layout).
 */
export class OrientationManager {
  private static started = false;
  private static scene: SceneId = 'home';
  private static needsLandscape = false;
  private static pausedForPortrait = false;
  private static layoutWidth = 0;
  private static layoutHeight = 0;
  private static unsubscribeScene: (() => void) | null = null;
  private static unsubscribeLocale: (() => void) | null = null;

  static init(root: HTMLElement = document.body): void {
    if (OrientationManager.started) return;
    OrientationManager.started = true;

    RotatePrompt.mount(root);

    OrientationManager.unsubscribeScene = EventBus.on('scene:changed', ({ id }) => {
      void OrientationManager.onSceneChanged(id);
    });
    OrientationManager.unsubscribeLocale = EventBus.on('settings:locale-changed', () => {
      RotatePrompt.refreshCopy();
    });

    window.addEventListener('resize', OrientationManager.onViewportChange);
    window.addEventListener('orientationchange', OrientationManager.onViewportChange);
    OrientationManager.apply();
  }

  static destroy(): void {
    OrientationManager.unsubscribeScene?.();
    OrientationManager.unsubscribeScene = null;
    OrientationManager.unsubscribeLocale?.();
    OrientationManager.unsubscribeLocale = null;
    window.removeEventListener('resize', OrientationManager.onViewportChange);
    window.removeEventListener('orientationchange', OrientationManager.onViewportChange);
    OrientationManager.unlockOrientation();
    OrientationManager.resumeIfPausedForPortrait();
    OrientationManager.pausedForPortrait = false;
    OrientationManager.needsLandscape = false;
    RotatePrompt.destroy();
    document.documentElement.classList.remove(NEEDS_LANDSCAPE_CLASS, LAYOUT_CLASS, 'portrait-rotate');
    document.documentElement.removeAttribute('data-scene');
    OrientationManager.started = false;
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    OrientationManager.destroy();
  }

  static getScene(): SceneId {
    return OrientationManager.scene;
  }

  /** True while the rotate-to-landscape prompt is shown. */
  static needsLandscapeOrientation(): boolean {
    return OrientationManager.needsLandscape;
  }

  /**
   * CSS portrait-rotate is retired — always false.
   * Kept so pointer helpers keep a stable no-op path.
   */
  static isPortraitRotateActive(): boolean {
    return false;
  }

  static getLayoutSize(): { width: number; height: number } {
    return {
      width: OrientationManager.layoutWidth,
      height: OrientationManager.layoutHeight,
    };
  }

  /** Map viewport pointer coordinates into landscape layout space. */
  static toLayoutCoords(clientX: number, clientY: number): { x: number; y: number } {
    return clientToLayout(
      clientX,
      clientY,
      window.innerWidth,
      window.innerHeight,
      false,
    );
  }

  private static async onSceneChanged(id: SceneId): Promise<void> {
    OrientationManager.scene = id;
    document.documentElement.classList.remove(`${SCENE_CLASS_PREFIX}home`, `${SCENE_CLASS_PREFIX}combat`, `${SCENE_CLASS_PREFIX}story`);
    document.documentElement.classList.add(`${SCENE_CLASS_PREFIX}${id}`);
    document.documentElement.dataset.scene = id;

    if (id === 'combat') {
      await OrientationManager.lockLandscape();
    } else {
      OrientationManager.unlockOrientation();
    }

    OrientationManager.apply();
  }

  private static onViewportChange = (): void => {
    OrientationManager.apply();
  };

  private static apply(): void {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const portrait = isPortraitViewport(viewportW, viewportH);

    OrientationManager.needsLandscape = portrait;

    // Native viewport size — no CSS axis swap (rotate prompt instead).
    const { width, height } = getLayoutDimensions(viewportW, viewportH, false);
    OrientationManager.layoutWidth = width;
    OrientationManager.layoutHeight = height;

    const root = document.documentElement;
    root.classList.remove('portrait-rotate');
    root.classList.toggle(NEEDS_LANDSCAPE_CLASS, OrientationManager.needsLandscape);
    root.classList.add(LAYOUT_CLASS);
    root.style.setProperty('--layout-w', `${width}px`);
    root.style.setProperty('--layout-h', `${height}px`);

    RotatePrompt.setVisible(OrientationManager.needsLandscape);
    OrientationManager.syncPauseForPortrait(OrientationManager.needsLandscape);
    OrientationManager.syncCanvasDisplays();

    EventBus.emit('layout:changed', {
      width,
      height,
      portraitRotate: false,
    });
  }

  private static syncPauseForPortrait(needsLandscape: boolean): void {
    if (needsLandscape) {
      if (OrientationManager.pausedForPortrait || document.hidden) return;
      OrientationManager.pausedForPortrait = true;
      GameClock.pause();
      EventBus.emit('app:pause', undefined);
      try {
        SceneRouter.instance.pauseActiveHost();
      } catch {
        // Router may not be ready during early boot.
      }
      return;
    }

    OrientationManager.resumeIfPausedForPortrait();
  }

  private static resumeIfPausedForPortrait(): void {
    if (!OrientationManager.pausedForPortrait) return;
    OrientationManager.pausedForPortrait = false;
    if (document.hidden) return;
    GameClock.resume();
    EventBus.emit('app:resume', undefined);
    try {
      SceneRouter.instance.resumeActiveHost();
    } catch {
      // Router may not be ready during early boot.
    }
  }

  /** Keep shared canvases filling #game-shell after Phaser or resize drift. */
  private static syncCanvasDisplays(): void {
    for (const id of ['canvas-2d', 'canvas-3d'] as const) {
      const canvas = document.getElementById(id);
      if (canvas instanceof HTMLCanvasElement) {
        syncGameCanvasDisplay(canvas);
      }
    }
  }

  private static async lockLandscape(): Promise<void> {
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (type: string) => Promise<void>;
      };
      await orientation.lock?.('landscape');
    } catch {
      // Expected on desktop browsers and outside installed PWA / fullscreen.
    }
  }

  private static unlockOrientation(): void {
    try {
      screen.orientation?.unlock?.();
    } catch {
      // No-op when unlock is unavailable.
    }
  }
}
