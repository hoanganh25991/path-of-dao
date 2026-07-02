import type Phaser from 'phaser';

/** Turns the hidden "collision" tile layer into static physics walls. */
export class CollisionLayer {
  /**
   * Enables collision on every non-empty tile of the layer and hides it.
   * Returns the configured layer (bodies collide against it in sub-plan 07+).
   */
  static apply(layer: Phaser.Tilemaps.TilemapLayer): Phaser.Tilemaps.TilemapLayer {
    layer.setCollisionByExclusion([-1]);
    layer.setVisible(false);
    return layer;
  }
}
