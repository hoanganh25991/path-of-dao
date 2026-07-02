import type Phaser from 'phaser';
import type { StatSheet } from '@/progression/StatSheet';

export type Facing = 1 | -1;

/** Shared fields for combat entities: arcade sprite + stat sheet + facing. */
export abstract class EntityBase {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly stats: StatSheet;
  facing: Facing = 1;

  protected constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    stats: StatSheet,
  ) {
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.stats = stats;
  }

  get scene(): Phaser.Scene {
    return this.sprite.scene;
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
