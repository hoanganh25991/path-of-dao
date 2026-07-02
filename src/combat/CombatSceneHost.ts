import Phaser from 'phaser';
import type { SceneHost } from '@/app/SceneHost';

class BootScene extends Phaser.Scene {
  private mapId = 'test';

  constructor() {
    super('BootScene');
  }

  init(data: { mapId?: string }): void {
    this.mapId = data.mapId ?? this.registry.get('mapId') ?? 'test';
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, `Combat: ${this.mapId}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#e8e4dc',
      })
      .setOrigin(0.5);
  }
}

/** Stub Phaser combat scene — replaced in sub-plan 06. */
export class CombatSceneHost implements SceneHost {
  readonly id = 'combat' as const;

  private game: Phaser.Game | null = null;

  constructor(private readonly mapId: string) {}

  async mount(container: HTMLElement): Promise<void> {
    const canvas = container.querySelector<HTMLCanvasElement>('#canvas-2d');
    if (!canvas) {
      throw new Error('CombatSceneHost: #canvas-2d not found');
    }

    const mapId = this.mapId;

    // Phaser.AUTO is not allowed with a custom canvas — renderType must be explicit.
    const renderType = window.WebGLRenderingContext ? Phaser.WEBGL : Phaser.CANVAS;

    this.game = new Phaser.Game({
      type: renderType,
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#1a1a2e',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      callbacks: {
        preBoot: (game) => {
          game.registry.set('mapId', mapId);
        },
      },
      scene: BootScene,
    });
  }

  async unmount(): Promise<void> {
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
