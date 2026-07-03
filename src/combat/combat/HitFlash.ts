import Phaser from 'phaser';

export const HIT_FLASH_MS = 50;

interface FlashEntry {
  sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite;
  remainingMs: number;
  previousTint: number;
}

const active = new Map<Phaser.GameObjects.GameObject, FlashEntry>();

/** White fill tint for 50ms; safe for pooled sprites (restores prior tint). */
export function applyHitFlash(sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite): void {
  const existing = active.get(sprite);
  if (existing) {
    existing.remainingMs = HIT_FLASH_MS;
    return;
  }

  active.set(sprite, {
    sprite,
    remainingMs: HIT_FLASH_MS,
    previousTint: sprite.tintTopLeft,
  });
  sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
}

/** Call once per frame from HitboxManager (or any combat tick). */
export function updateHitFlashes(dtMs: number): void {
  for (const [key, entry] of active) {
    entry.remainingMs -= dtMs;
    if (entry.remainingMs <= 0) {
      if (entry.sprite.active) {
        if (entry.previousTint === 0xffffff) {
          entry.sprite.clearTint();
        } else {
          entry.sprite.setTint(entry.previousTint);
        }
      }
      active.delete(key);
    }
  }
}

/** Clear tracking when a sprite is destroyed (pool release). */
export function clearHitFlash(sprite: Phaser.GameObjects.GameObject): void {
  active.delete(sprite);
}
