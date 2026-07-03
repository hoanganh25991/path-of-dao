import type { SceneId } from '@/app/SceneId';
import { EventBus } from '@/core/EventBus';
import {
  clientToLayout,
  getLayoutDimensions,
  isPortraitViewport,
} from '@/app/orientation/layoutCoords';

const ROOT_CLASS = 'portrait-rotate';
const LAYOUT_CLASS = 'landscape-layout';
const SCENE_CLASS_PREFIX = 'scene-';

/** Manages landscape-first layout, portrait auto-rotate, and combat orientation lock. */
export class OrientationManager {
  private static started = false;
  private static scene: SceneId = 'home';
  private static portraitRotate = false;
  private static layoutWidth = 0;
  private static layoutHeight = 0;
  private static unsubscribeScene: (() => void) | null = null;

  static init(): void {
    if (OrientationManager.started) return;
    OrientationManager.started = true;

    OrientationManager.unsubscribeScene = EventBus.on('scene:changed', ({ id }) => {
      void OrientationManager.onSceneChanged(id);
    });

    window.addEventListener('resize', OrientationManager.onViewportChange);
    window.addEventListener('orientationchange', OrientationManager.onViewportChange);
    OrientationManager.apply();
  }

  static destroy(): void {
    OrientationManager.unsubscribeScene?.();
    OrientationManager.unsubscribeScene = null;
    window.removeEventListener('resize', OrientationManager.onViewportChange);
    window.removeEventListener('orientationchange', OrientationManager.onViewportChange);
    OrientationManager.unlockOrientation();
    document.documentElement.classList.remove(ROOT_CLASS, LAYOUT_CLASS);
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

  static isPortraitRotateActive(): boolean {
    return OrientationManager.portraitRotate;
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
      OrientationManager.portraitRotate,
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

    // Default landscape; auto-rotate layout when the device/browser is portrait.
    OrientationManager.portraitRotate = portrait;

    const { width, height } = getLayoutDimensions(viewportW, viewportH, OrientationManager.portraitRotate);
    OrientationManager.layoutWidth = width;
    OrientationManager.layoutHeight = height;

    const root = document.documentElement;
    root.classList.toggle(ROOT_CLASS, OrientationManager.portraitRotate);
    root.classList.add(LAYOUT_CLASS);
    root.style.setProperty('--layout-w', `${width}px`);
    root.style.setProperty('--layout-h', `${height}px`);

    EventBus.emit('layout:changed', { width, height, portraitRotate: OrientationManager.portraitRotate });
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
