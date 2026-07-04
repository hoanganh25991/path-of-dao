import Phaser from 'phaser';
import { STRIKE_ANIM, WEAPON_STRIKE_ANIM, type WeaponStrikeKind } from '@/combat/art/stickyManStrikes';
import { ANIM } from '@/combat/art/stickyManAssets';
import { moveSpeedPxPerSec } from '@/progression/DamageCalculator';
import { isArmedAttackStyle } from '@/progression/WeaponProgression';
import { MAX_COMBO_STEP, type PlayerStateId } from '@/combat/state/PlayerStateMachine';
import type { Player } from '@/combat/entities/Player';

/**
 * Pick a weapon strike of the correct combo step if the state machine happened
 * to roll a variant that belongs to a different step.
 */
function selectWeaponStrikeForStep(step: 1 | 2 | 3, kind: WeaponStrikeKind): WeaponStrikeKind {
  if (step === 3 || kind.endsWith('3')) {
    if (kind === 'wepSlam3' || kind === 'wepSpin3') return kind;
    return 'wepSlam3';
  }
  if (step === 2 || kind.endsWith('2')) {
    if (kind === 'wepSlash2' || kind === 'wepThrust2') return kind;
    return 'wepSlash2';
  }
  if (kind === 'wepSlash1' || kind === 'wepChop1') return kind;
  return 'wepSlash1';
}

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
      let strikeAnim: string;
      if (isArmedAttackStyle(this.player.attackStyle)) {
        const weaponKind = selectWeaponStrikeForStep(step as 1 | 2 | 3, sm.weaponStrikeKind);
        strikeAnim = WEAPON_STRIKE_ANIM[weaponKind];
      } else {
        strikeAnim = STRIKE_ANIM[sm.strikeKind];
      }

      if (step !== this.lastAttackStep || strikeAnim !== this.lastStrikeAnim) {
        this.lastAttackStep = step;
        this.lastStrikeAnim = strikeAnim;
        sprite.play(this.player.resolveAnim(strikeAnim));
      }

      sprite.anims.timeScale = 1;
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
