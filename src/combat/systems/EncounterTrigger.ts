import Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { InputManager } from '@/core/input/InputManager';
import { gameStore } from '@/core/store/gameStore';
import type { MapConfig } from '@/combat/map/MapConfig';
import type { Player } from '@/combat/entities/Player';
import {
  getPoiEncounter,
  rollOnBossRematch,
  rollOnKillStreak,
  rollOnMapEnter,
  rollOnWaveClear,
  wasPoiFound,
} from '@/progression/FortuitousEncounterManager';
import type { EncounterDefinition } from '@/shared/schemas/fortuitous-encounters';
import { showEncounterModal } from '@/ui/modals/EncounterModal';

const SLOWMO_SCALE = 0.3;
const SLOWMO_MS = 1000;
const POI_DEPTH = 9;

interface PoiState {
  key: string;
  poiType: 'hidden_cave' | 'ancient_sword';
  zone: Phaser.GameObjects.Zone;
  sparkle: Phaser.GameObjects.Arc;
  triggered: boolean;
}

/**
 * Map hooks for fortuitous encounters — rolls, POI sparkles, kill streaks (sub-plan 15).
 */
export class EncounterTrigger {
  private readonly mapId: string;
  private readonly pois: PoiState[] = [];
  private killStreak = 0;
  private presenting = false;
  private destroyed = false;
  private readonly unsubscribers: Array<() => void> = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    config: MapConfig,
  ) {
    this.mapId = config.id;
    this.createPois(config);

    this.unsubscribers.push(
      EventBus.on('map:wave-cleared', () => this.onWaveCleared()),
      EventBus.on('map:enemy-killed', (payload) => this.onEnemyKilled(payload)),
    );

    scene.time.delayedCall(800, () => this.tryMapEnterRoll());
  }

  destroy(): void {
    this.destroyed = true;
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers.length = 0;
    for (const poi of this.pois) {
      poi.zone.destroy();
      poi.sparkle.destroy();
    }
    this.pois.length = 0;
  }

  private createPois(config: MapConfig): void {
    for (const [index, poi] of config.pois.entries()) {
      const key = poi.id ?? `${poi.type}.${index}`;
      const encounter = getPoiEncounter(poi.type);
      const save = gameStore.getState().save;
      if (save && wasPoiFound(encounter.id, key, save)) continue;

      const sparkle = this.scene.add
        .circle(poi.x, poi.y, 6, 0xfff4a8, 0.9)
        .setDepth(POI_DEPTH);
      this.scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0.4, to: 1 },
        scale: { from: 0.85, to: 1.15 },
        duration: 900,
        yoyo: true,
        repeat: -1,
      });

      const zone = this.scene.add.zone(poi.x, poi.y, poi.radius * 2, poi.radius * 2);
      this.scene.physics.add.existing(zone, true);

      const state: PoiState = { key, poiType: poi.type, zone, sparkle, triggered: false };
      this.pois.push(state);

      this.scene.physics.add.overlap(this.player.sprite, zone, () => {
        if (state.triggered || this.presenting || this.destroyed) return;
        state.triggered = true;
        void this.presentEncounter(getPoiEncounter(poi.type), key);
      });
    }
  }

  private onWaveCleared(): void {
    const save = gameStore.getState().save;
    if (!save || this.presenting || this.destroyed) return;
    const encounter = rollOnWaveClear(this.mapId, save);
    if (encounter) void this.presentEncounter(encounter);
  }

  private onEnemyKilled(payload: {
    enemyId: string;
    isBoss: boolean;
    wasRematch: boolean;
  }): void {
    if (this.destroyed || this.presenting) return;
    const save = gameStore.getState().save;
    if (!save) return;

    this.killStreak += 1;

    if (payload.wasRematch) {
      const rematch = rollOnBossRematch(save);
      if (rematch) {
        void this.presentEncounter(rematch);
        return;
      }
    }

    const streakEncounter = rollOnKillStreak(this.killStreak, save);
    if (streakEncounter) {
      this.killStreak = 0;
      void this.presentEncounter(streakEncounter);
    }
  }

  private tryMapEnterRoll(): void {
    if (this.destroyed || this.presenting) return;
    const save = gameStore.getState().save;
    if (!save) return;
    const encounter = rollOnMapEnter(this.mapId, save);
    if (encounter) void this.presentEncounter(encounter);
  }

  private async presentEncounter(
    encounter: EncounterDefinition,
    poiKey?: string,
  ): Promise<void> {
    if (this.presenting || this.destroyed) return;
    this.presenting = true;

    const uiRoot = document.getElementById('ui-root');
    if (!uiRoot) {
      this.presenting = false;
      return;
    }

    InputManager.setEnabled(false);
    this.scene.physics.pause();
    const prevTimeScale = this.scene.time.timeScale;
    this.scene.time.timeScale = SLOWMO_SCALE;

    await new Promise<void>((resolve) => {
      this.scene.time.delayedCall(SLOWMO_MS, () => {
        this.scene.time.timeScale = 0;
        resolve();
      });
    });

    await showEncounterModal(uiRoot, { encounter, poiKey });

    this.scene.time.timeScale = prevTimeScale;
    this.scene.physics.resume();
    InputManager.setEnabled(true);
    this.presenting = false;
  }
}
