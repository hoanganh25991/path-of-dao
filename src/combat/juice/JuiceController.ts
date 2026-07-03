import Phaser from 'phaser';
import { hitJuiceProfile } from '@/combat/juice/hitJuiceProfile';

export interface HitJuiceOptions {
  isCrit: boolean;
  finalDamage: number;
  skillMultiplier: number;
}

/** Combat feel — hit-stop, camera shake, crit flash (sub-plan 25). */
export class JuiceController {
  private hitStopToken = 0;
  private critFlash: Phaser.GameObjects.Rectangle | null = null;
  private enabled = true;

  constructor(private readonly scene: Phaser.Scene) {}

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  /** Main camera — undefined after Phaser scene shutdown (CameraManager.shutdown). */
  private getMainCamera(): Phaser.Cameras.Scene2D.Camera | null {
    return this.scene?.cameras?.main ?? null;
  }

  applyHitJuice(opts: HitJuiceOptions): void {
    if (!this.enabled) return;
    const camera = this.getMainCamera();
    if (!camera) return;

    const profile = hitJuiceProfile(opts.isCrit, opts.finalDamage, opts.skillMultiplier);

    if (profile.shakePx > 0) {
      const duration = profile.shakePx * 18;
      const intensity = profile.shakePx * 0.002;
      camera.shake(duration, intensity);
    }

    if (profile.stopMs > 0) {
      this.applyHitStop(profile.stopMs);
    }

    if (profile.critFlash) {
      this.flashCrit();
    }
  }

  applyBossPhaseJuice(): void {
    if (!this.enabled) return;
    const camera = this.getMainCamera();
    if (!camera) return;
    camera.shake(500, 0.012);
    this.applyHitStop(60);
    this.darkenScreen(500);
  }

  private applyHitStop(ms: number): void {
    const token = ++this.hitStopToken;
    const prevScale = this.scene.time.timeScale;
    this.scene.time.timeScale = 0.12;
    this.scene.time.delayedCall(ms, () => {
      if (token !== this.hitStopToken) return;
      this.scene.time.timeScale = prevScale;
    });
  }

  private flashCrit(): void {
    const { width, height } = this.scene.scale;
    if (!this.critFlash) {
      this.critFlash = this.scene.add
        .rectangle(width / 2, height / 2, width, height, 0xffffff, 0)
        .setScrollFactor(0)
        .setDepth(10_000)
        .setBlendMode(Phaser.BlendModes.ADD);
    }

    this.critFlash.setPosition(width / 2, height / 2);
    this.critFlash.setSize(width, height);
    this.critFlash.setAlpha(0.05);
    this.scene.tweens.add({
      targets: this.critFlash,
      alpha: 0,
      duration: 80,
      ease: 'Quad.easeOut',
    });
  }

  private darkenScreen(ms: number): void {
    const { width, height } = this.scene.scale;
    const veil = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setScrollFactor(0)
      .setDepth(9_999);

    this.scene.tweens.add({
      targets: veil,
      fillAlpha: 0.35,
      duration: ms * 0.25,
      yoyo: true,
      hold: ms * 0.5,
      onComplete: () => veil.destroy(),
    });
  }

  destroy(): void {
    this.critFlash?.destroy();
    this.critFlash = null;
    this.hitStopToken += 1;
    this.scene.time.timeScale = 1;
  }
}
