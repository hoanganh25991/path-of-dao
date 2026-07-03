import type Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { JuiceController } from '@/combat/juice/JuiceController';

/** Bridges combat EventBus events to JuiceController while MapScene is active. */
export class CombatJuiceBridge {
  private readonly unsubs: Array<() => void> = [];

  constructor(
    _scene: Phaser.Scene,
    private readonly juice: JuiceController,
  ) {}

  mount(): void {
    this.unsubs.push(
      EventBus.on('combat:hit-landed', (payload) => {
        if (payload.attackerTeam !== 'player' || payload.victimTeam !== 'enemy') return;
        this.juice.applyHitJuice({
          isCrit: payload.isCrit,
          finalDamage: payload.finalDamage,
          skillMultiplier: payload.skillMultiplier,
        });
      }),
      EventBus.on('map:enemy-killed', ({ isBoss }) => {
        if (isBoss) this.juice.applyBossPhaseJuice();
      }),
    );
  }

  destroy(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs.length = 0;
    this.juice.destroy();
  }
}
