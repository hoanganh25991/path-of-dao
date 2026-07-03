import { PerspectiveCamera, WebGLRenderer } from 'three';
import type { SceneHost } from '@/app/SceneHost';
import { EventBus } from '@/core/EventBus';
import { GameClock } from '@/core/GameClock';
import { gameStore } from '@/core/store/gameStore';
import { resizeCamera } from '@/home/CameraRig';
import { disposeRenderer } from '@/home/disposeThree';
import { HomeScene } from '@/home/HomeScene';

/** Full Three.js home shrine — floating island, hero viewer, realm aura. */
export class HomeSceneHost implements SceneHost {
  readonly id = 'home' as const;

  private renderer: WebGLRenderer | null = null;
  private homeScene: HomeScene | null = null;
  private rafId: number | null = null;
  private running = false;
  private lastTapMs = 0;
  private unsubscribeEquipment: (() => void) | null = null;

  private readonly onResize = (): void => {
    if (!this.renderer || !this.homeScene?.cameraRig) return;
    resizeCamera(
      this.homeScene.cameraRig.controls.object as PerspectiveCamera,
      this.renderer,
      window.innerWidth,
      window.innerHeight,
    );
  };

  private readonly onDoubleTap = (event: PointerEvent): void => {
    const now = performance.now();
    if (now - this.lastTapMs < 320) {
      this.homeScene?.cameraRig?.reset();
      event.preventDefault();
    }
    this.lastTapMs = now;
  };

  async mount(container: HTMLElement): Promise<void> {
    const canvas = container.querySelector<HTMLCanvasElement>('#canvas-3d');
    if (!canvas) {
      throw new Error('HomeSceneHost: #canvas-3d not found');
    }

    const save = gameStore.getState().save;
    if (!save) {
      throw new Error('HomeSceneHost: save not loaded');
    }

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.homeScene = new HomeScene();
    await this.homeScene.build(this.renderer, canvas, save);

    this.unsubscribeEquipment = EventBus.on('equipment:changed', () => {
      const current = gameStore.getState().save;
      if (!current || !this.homeScene) return;
      void this.homeScene.syncEquipment(current.equipped);
    });

    window.addEventListener('resize', this.onResize);
    canvas.addEventListener('pointerdown', this.onDoubleTap);

    this.running = true;
    this.startLoop();
  }

  async unmount(): Promise<void> {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    window.removeEventListener('resize', this.onResize);
    this.unsubscribeEquipment?.();
    this.unsubscribeEquipment = null;

    const canvas = this.renderer?.domElement;
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.onDoubleTap);
    }

    this.homeScene?.dispose();
    this.homeScene = null;

    if (this.renderer) {
      disposeRenderer(this.renderer);
      this.renderer = null;
    }
  }

  pause(): void {
    this.running = false;
    GameClock.pause();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume(): void {
    GameClock.resume();
    if (!this.running) {
      this.running = true;
    }
    if (this.rafId === null) {
      this.startLoop();
    }
  }

  private startLoop(): void {
    const tick = (now: number): void => {
      if (!this.running || !this.renderer || !this.homeScene) return;

      GameClock.tick(now);
      const delta = GameClock.deltaMs / 1000;

      this.homeScene.update(delta);
      this.homeScene.render(this.renderer);

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
