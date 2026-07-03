import type Phaser from 'phaser';
import { ANIM } from '@/combat/art/stickyManAssets';
import type { PlayerStateId } from '@/combat/state/PlayerStateMachine';
import type { Player } from '@/combat/entities/Player';

/**
 * Sticky-man sprite animations driven by the player state machine.
 * Dev-only state label above the player for debugging.
 */
export class PlayerAnimController {
  private label: Phaser.GameObjects.Text | null = null;
  private lastState: PlayerStateId | null = null;
  private lastAttackStep = 0;

  constructor(private readonly player: Player) {
    if (import.meta.env.DEV) {
      this.label = player.scene.add
        .text(player.x, player.y - 30, 'idle', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#e8e4dc',
        })
        .setOrigin(0.5, 1)
        .setDepth(30);
    }
    this.player.sprite.play(ANIM.heroIdle);
  }

  update(): void {
    const sm = this.player.sm;
    const sprite = this.player.sprite;
    const state = sm.state;

    if (state !== this.lastState) {
      this.lastState = state;
      this.label?.setText(state);
    }

    if (state === 'dead') {
      sprite.anims.stop();
      sprite.setTint(0x666666);
      this.label?.setPosition(this.player.x, this.player.y - 40);
      return;
    }

    if (state !== 'dodge') {
      sprite.clearTint();
    }

    if (state === 'hitstun') {
      this.playOnce(ANIM.heroHit);
    } else if (state === 'attack') {
      const step = sm.attackStep;
      if (step !== this.lastAttackStep) {
        this.lastAttackStep = step;
        const key =
          step === 1 ? ANIM.heroAttack1 : step === 2 ? ANIM.heroAttack2 : ANIM.heroAttack3;
        sprite.play(key);
      }
    } else {
      this.lastAttackStep = 0;
      if (state === 'move') {
        this.playLoop(ANIM.heroWalk);
      } else if (state === 'dodge') {
        // DodgeComponent owns alpha; keep walk-ish motion readable
        this.playLoop(ANIM.heroWalk);
      } else {
        this.playLoop(ANIM.heroIdle);
      }
    }

    this.label?.setPosition(this.player.x, this.player.y - 40);
  }

  destroy(): void {
    this.label?.destroy();
    this.label = null;
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
      sprite.play(key);
    }
  }
}
