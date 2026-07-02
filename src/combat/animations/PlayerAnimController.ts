import type Phaser from 'phaser';
import type { PlayerStateId } from '@/combat/state/PlayerStateMachine';
import type { Player } from '@/combat/entities/Player';

/**
 * Placeholder animation: tint per state + dev-only state label above the
 * player (sub-plan 07 §13). Swapped for real sprite sheets in asset pass.
 */
export class PlayerAnimController {
  private label: Phaser.GameObjects.Text | null = null;
  private lastState: PlayerStateId | null = null;

  private static readonly TINTS: Record<PlayerStateId, number | null> = {
    idle: null,
    move: null,
    attack: 0xffe08a,
    dodge: 0x9ad4ff,
    hitstun: 0xff8a8a,
    dead: 0x666666,
  };

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
  }

  update(): void {
    const state = this.player.sm.state;

    if (state !== this.lastState) {
      this.lastState = state;
      const tint = PlayerAnimController.TINTS[state];
      if (tint === null) {
        this.player.sprite.clearTint();
      } else {
        this.player.sprite.setTint(tint);
      }
      this.label?.setText(state);
    }

    this.label?.setPosition(this.player.x, this.player.y - 30);
  }

  destroy(): void {
    this.label?.destroy();
    this.label = null;
  }
}
