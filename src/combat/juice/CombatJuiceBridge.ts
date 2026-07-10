import type Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { JuiceController } from '@/combat/juice/JuiceController';

/** Bridges combat EventBus events to JuiceController while MapScene is active. */
export class CombatJuiceBridge {
  private readonly unsubs: Array<() => void> = [];
  private active = false;

  constructor(
    _scene: Phaser.Scene,
    private readonly juice: JuiceController,
  ) {}

  mount(): void {
    this.active = true;
    this.unsubs.push(
      EventBus.on('combat:hit-landed', (payload) => {
        if (!this.active) return;
        if (payload.attackerTeam !== 'player' || payload.victimTeam !== 'cultivator') return;
        this.juice.applyHitJuice({
          isCrit: payload.isCrit,
          finalDamage: payload.finalDamage,
          skillMultiplier: payload.skillMultiplier,
        });
      }),
      EventBus.on('map:cultivator-defeated', ({ isBoss }) => {
        if (!this.active || !isBoss) return;
        this.juice.applyBossPhaseJuice();
      }),
      EventBus.on('map:enemy-killed', ({ isBoss }) => {
        if (!this.active || !isBoss) return;
        this.juice.applyBossPhaseJuice();
      }),
      EventBus.on('combat:boss-phase-changed', () => {
        if (!this.active) return;
        this.juice.applyBossPhaseJuice();
      }),
    );
  }

  destroy(): void {
    this.active = false;
    for (const unsub of this.unsubs) unsub();
    this.unsubs.length = 0;
    this.juice.destroy();
  }
}
