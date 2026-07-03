import Phaser from 'phaser';
import type { SceneHost } from '@/app/SceneHost';
import { OrientationManager } from '@/app/OrientationManager';
import { EventBus } from '@/core/EventBus';
import { BootScene } from '@/combat/scenes/BootScene';
import { MapScene } from '@/combat/scenes/MapScene';
import { PoolManager } from '@/combat/PoolManager';

/** Hosts the Phaser combat pipeline (BootScene → MapScene). */
export class CombatSceneHost implements SceneHost {
  readonly id = 'combat' as const;

  private game: Phaser.Game | null = null;
  private unsubscribeLayout: (() => void) | null = null;

  constructor(private readonly mapId: string) {}

  async mount(container: HTMLElement): Promise<void> {
    const canvas = container.querySelector<HTMLCanvasElement>('#canvas-2d');
    if (!canvas) {
      throw new Error('CombatSceneHost: #canvas-2d not found');
    }

    const mapId = this.mapId;
    const { width, height } = OrientationManager.getLayoutSize();

    // Phaser.AUTO is not allowed with a custom canvas — renderType must be explicit.
    const renderType = window.WebGLRenderingContext ? Phaser.WEBGL : Phaser.CANVAS;

    await new Promise<void>((resolve) => {
      this.game = new Phaser.Game({
        type: renderType,
        canvas,
        width,
        height,
        backgroundColor: '#0d1117',
        scale: {
          // NONE — RESIZE reads getBoundingClientRect which is viewport-aligned
          // (390×844) when #app is CSS-rotated, squashing square tiles.
          mode: Phaser.Scale.NONE,
          autoCenter: Phaser.Scale.NO_CENTER,
        },
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        callbacks: {
          preBoot: (game) => {
            game.registry.set('mapId', mapId);
          },
          postBoot: () => {
            resolve();
          },
        },
        scene: [BootScene, MapScene],
      });
    });

    this.game.scale.resize(width, height);

    this.unsubscribeLayout = EventBus.on('layout:changed', ({ width: w, height: h }) => {
      this.game?.scale.resize(w, h);
    });

    if (import.meta.env.DEV) {
      // Debug handle for browser smoke tests / console poking.
      (window as unknown as Record<string, unknown>).__phaserGame = this.game;
    }
  }

  async unmount(): Promise<void> {
    this.unsubscribeLayout?.();
    this.unsubscribeLayout = null;
    PoolManager.clear();
    if (this.game) {
      // Wake the loop so Phaser processes the deferred destroy (a sleeping
      // loop never steps), and keep the shared #canvas-2d in the DOM.
      this.game.loop.wake();
      this.game.destroy(false);
      this.game = null;
    }
  }

  pause(): void {
    this.game?.loop.sleep();
  }

  resume(): void {
    this.game?.loop.wake();
  }
}
