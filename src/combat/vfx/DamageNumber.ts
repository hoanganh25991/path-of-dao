import Phaser from 'phaser';

const POOL_SIZE = 12;
const FLOAT_PX = 40;
const NORMAL_DURATION_MS = 600;
const CRIT_DURATION_MS = 700;
const CRIT_SCALE = 1.3;

interface PooledText {
  text: Phaser.GameObjects.Text;
  active: boolean;
}

/** Pool of floating damage numbers in world space. */
export class DamageNumberPool {
  private readonly pool: PooledText[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const text = scene.add
        .text(0, 0, '', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(30)
        .setVisible(false);
      this.pool.push({ text, active: false });
    }
  }

  spawn(value: number, isCrit: boolean, x: number, y: number): void {
    const entry = this.pool.find((p) => !p.active);
    if (!entry) return;

    const { text } = entry;
    entry.active = true;
    text
      .setText(isCrit ? `${value}!` : String(value))
      .setPosition(x, y - 8)
      .setAlpha(1)
      .setScale(isCrit ? CRIT_SCALE : 1)
      .setColor(isCrit ? '#ffd54a' : '#ffffff')
      .setFontSize(isCrit ? '20px' : '14px')
      .setVisible(true);

    const duration = isCrit ? CRIT_DURATION_MS : NORMAL_DURATION_MS;
    this.scene.tweens.add({
      targets: text,
      y: y - 8 - FLOAT_PX,
      alpha: 0,
      scale: isCrit ? 1 : 1,
      duration,
      onComplete: () => {
        text.setVisible(false);
        entry.active = false;
      },
    });
  }

  /** For tests — count entries still animating. */
  get activeCount(): number {
    return this.pool.filter((p) => p.active).length;
  }

  destroy(): void {
    for (const entry of this.pool) {
      entry.text.destroy();
    }
    this.pool.length = 0;
  }
}
