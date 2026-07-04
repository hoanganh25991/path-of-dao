import type Phaser from 'phaser';

/** Turns the hidden "collision" tile layer into static physics walls. */
export class CollisionLayer {
  /**
   * Enables collision on impassable tiles and hides the layer.
   * Returns the configured layer (bodies collide against it in sub-plan 07+).
   */
  static apply(layer: Phaser.Tilemaps.TilemapLayer): Phaser.Tilemaps.TilemapLayer {
    // Collision layer only places rock (4), trunk (6), water (8); empty cells are 0.
    layer.setCollisionByExclusion([-1, 0]);
    layer.setVisible(false);
    return layer;
  }
}
