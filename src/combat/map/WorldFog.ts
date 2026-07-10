import Phaser from 'phaser';
import type { WorldFogConfig } from '@/combat/world/ProceduralWorldConfig';

/** Region-unique mist overlay — soft camera-fixed haze, no hard vignette ring. */
export class WorldFogOverlay {
  private readonly layers: Phaser.GameObjects.GameObject[] = [];

  constructor(
    scene: Phaser.Scene,
    camera: Phaser.Cameras.Scene2D.Camera,
    config: WorldFogConfig,
  ) {
    const w = camera.width;
    const h = camera.height;
    const color = Phaser.Display.Color.HexStringToColor(config.color).color;

    const base = scene.add
      .rectangle(w / 2, h / 2, w, h, color, config.alpha * 0.42)
      .setScrollFactor(0)
      .setDepth(95);
    this.layers.push(base);

    const softEdge = scene.add
      .rectangle(w / 2, h / 2, w * 1.08, h * 1.08, color, config.alpha * 0.18)
      .setScrollFactor(0)
      .setDepth(94);
    this.layers.push(softEdge);
  }

  destroy(): void {
    for (const layer of this.layers) {
      layer.destroy();
    }
    this.layers.length = 0;
  }
}
