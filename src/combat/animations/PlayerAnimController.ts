import Phaser from 'phaser';
import { ANIM } from '@/combat/art/stickyManAssets';
import { moveSpeedPxPerSec } from '@/progression/DamageCalculator';
import { isArmedAttackStyle, type AttackStyle } from '@/progression/WeaponProgression';
import { MAX_COMBO_STEP } from '@/combat/state/PlayerStateMachine';
import type { PlayerStateId } from '@/combat/state/PlayerStateMachine';
import type { Player } from '@/combat/entities/Player';

const HEAVY_PALM_ANIMS = [
  ANIM.heroPalmHeavyHaymaker,
  ANIM.heroPalmHeavyUppercut,
  ANIM.heroPalmHeavyBody,
] as const;

function attackAnimKey(style: AttackStyle, step: number, heavyVariant: number): string {
  if (isArmedAttackStyle(style)) {
    return step === 1 ? ANIM.heroAttack1 : step === 2 ? ANIM.heroAttack2 : ANIM.heroAttack3;
  }
  if (step === 1) return ANIM.heroPalmAttack1;
  if (step === 2) return ANIM.heroPalmAttack2;
  return HEAVY_PALM_ANIMS[heavyVariant % HEAVY_PALM_ANIMS.length] ?? ANIM.heroPalmHeavyHaymaker;
}

/**
 * Sticky-man sprite animations driven by the player state machine.
 */
export class PlayerAnimController {
  private lastState: PlayerStateId | null = null;
  private lastAttackStep = 0;
  private lastHeavyVariant = -1;

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
    } else if (state === 'attack') {
      const step = sm.attackStep;
      const heavyVariant = sm.heavyFinisherVariant;
      if (step !== this.lastAttackStep || heavyVariant !== this.lastHeavyVariant) {
        this.lastAttackStep = step;
        this.lastHeavyVariant = heavyVariant;
        const key = attackAnimKey(this.player.attackStyle, step, heavyVariant);
        sprite.play(this.player.resolveAnim(key));
      }
    } else {
      this.lastAttackStep = 0;
      this.lastHeavyVariant = -1;
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

    if (state === 'attack' && sm.attackStep === MAX_COMBO_STEP && !isArmedAttackStyle(this.player.attackStyle)) {
      sprite.anims.timeScale = 0.85;
    } else if (state !== 'move' && state !== 'dodge') {
      sprite.anims.timeScale = 1;
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

  /** Scale walk playback to actual velocity so feet do not slide. */
  private syncWalkTimeScale(sprite: Phaser.Physics.Arcade.Sprite): void {
    const body = this.player.body;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const base = moveSpeedPxPerSec(this.player.stats.resolved.speed);
    const scale = base > 0 ? Phaser.Math.Clamp(speed / base, 0.6, 1.4) : 1;
    sprite.anims.timeScale = scale;
  }
}
