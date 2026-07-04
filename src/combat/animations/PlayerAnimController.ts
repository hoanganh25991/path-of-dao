import Phaser from 'phaser';
import { STRIKE_ANIM } from '@/combat/art/stickyManStrikes';
import { ANIM } from '@/combat/art/stickyManAssets';
import { moveSpeedPxPerSec } from '@/progression/DamageCalculator';
import { isArmedAttackStyle } from '@/progression/WeaponProgression';
import { MAX_COMBO_STEP, type PlayerStateId } from '@/combat/state/PlayerStateMachine';
import type { Player } from '@/combat/entities/Player';

/**
 * Sticky-man sprite animations driven by the player state machine.
 */
export class PlayerAnimController {
  private lastState: PlayerStateId | null = null;
  private lastAttackStep = 0;
  private lastStrikeAnim = '';

  constructor(private readonly player: Player) {
    this.player.sprite.play(this.player.resolveAnim(ANIM.heroIdle));
  }

  update(): void {
    const sm = this.player.sm;
    const sprite = this.player.sprite;
    const state = sm.state;

    if (state !== this.lastState) {
      this.lastState = state;
    }

    if (state === 'dead') {
      sprite.anims.stop();
      sprite.setTint(0x666666);
      return;
    }

    if (state !== 'dodge') {
      sprite.clearTint();
    }

    if (state === 'hitstun') {
      this.playOnce(this.player.resolveAnim(ANIM.heroHit));
    } else if (state === 'meditate') {
      this.playLoop(this.player.resolveAnim(ANIM.heroSit));
      sprite.anims.timeScale = 1;
    } else if (state === 'attack') {
      const step = sm.attackStep;
      const strikeAnim = isArmedAttackStyle(this.player.attackStyle)
        ? step === 1
          ? ANIM.heroAttack1
          : step === 2
            ? ANIM.heroAttack2
            : ANIM.heroAttack3
        : STRIKE_ANIM[sm.strikeKind];

      if (step !== this.lastAttackStep || strikeAnim !== this.lastStrikeAnim) {
        this.lastAttackStep = step;
        this.lastStrikeAnim = strikeAnim;
        sprite.play(this.player.resolveAnim(strikeAnim));
      }

      const heavy = step === MAX_COMBO_STEP && !isArmedAttackStyle(this.player.attackStyle);
      sprite.anims.timeScale = heavy ? 0.9 : 1;
    } else {
      this.lastAttackStep = 0;
      this.lastStrikeAnim = '';
      if (state === 'move') {
        this.playLoop(this.player.resolveAnim(ANIM.heroWalk));
        this.syncWalkTimeScale(sprite);
      } else if (state === 'dodge') {
        this.playLoop(this.player.resolveAnim(ANIM.heroWalk));
        this.syncWalkTimeScale(sprite);
      } else {
        sprite.anims.timeScale = 1;
        this.playLoop(this.player.resolveAnim(ANIM.heroIdle));
      }
    }
  }

  destroy(): void {
  }

  private playLoop(key: string): void {
    const sprite = this.player.sprite;
    if (sprite.anims.currentAnim?.key !== key) {
      sprite.play(key);
    }
  }

  private playOnce(key: string): void {
    const sprite = this.player.sprite;
    if (sprite.anims.currentAnim?.key !== key || !sprite.anims.isPlaying) {
      sprite.anims.timeScale = 1;
      sprite.play(key);
    }
  }

  private syncWalkTimeScale(sprite: Phaser.Physics.Arcade.Sprite): void {
    const body = this.player.body;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const base = moveSpeedPxPerSec(this.player.stats.resolved.speed);
    const scale = base > 0 ? Phaser.Math.Clamp(speed / base, 0.6, 1.4) : 1;
    sprite.anims.timeScale = scale;
  }
}
