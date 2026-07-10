import Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import type { Player } from '@/combat/entities/Player';
import { Cultivator, STRIKE_MS } from '@/combat/entities/Cultivator';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import { getEncounterConfig, getCultivatorConfig } from '@/combat/cultivators/CultivatorLoader';
import type { EncounterConfig } from '@/combat/cultivators/CultivatorConfig';
import { CultivatorPool } from '@/combat/systems/CultivatorPool';
import { computeKillRewards } from '@/combat/systems/rewards';
import { rollCultivatorLoot } from '@/combat/systems/lootRoll';
import { CombatPickupController } from '@/combat/systems/CombatPickupController';
import { syncRealmProgress } from '@/progression/BreakthroughManager';
import { emitKillProgressionEvents } from '@/combat/systems/killProgressionEvents';
import { recordJourney } from '@/progression/JourneyLog';
import { unlockSkillForBoss, unlockSkillsForLevel } from '@/progression/SkillUnlockManager';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import {
  resolveEncounterScale,
  scaleEncounterForPower,
  type EncounterScale,
} from '@/combat/systems/EncounterScaling';
import { getRealmOrder } from '@/progression/RealmStatScaling';

export const MAX_ALIVE = 24;
const NEXT_WAVE_DELAY_MS = 1500;
const WAVE_RESET_DELAY_MS = 1700;
const MELEE_HIT_SLACK = 1.3;

const ARROW_SPEED = 300;
const ARROW_TTL_MS = 2000;
const ARROW_HIT_RADIUS = 16;

interface QueuedSpawn {
  cultivatorId: string;
  x: number;
  y: number;
}

interface Arrow {
  img: Phaser.Physics.Arcade.Image;
  hitboxId: string;
  ttlMs: number;
}

/**
 * Owns the map's encounter: wave spawning (scaled live cap, queue overflow),
 * cultivator strike hitboxes, arrows, loot pickups, and defeat rewards.
 */
export class SpawnManager {
  private readonly pool: CultivatorPool;
  private readonly encounter: EncounterConfig;
  private readonly encounterScale: EncounterScale;
  private maxAlive: number;
  private queue: QueuedSpawn[] = [];
  private waveIndex = -1;
  private waveActive = false;
  private arrows: Arrow[] = [];
  private pickups!: CombatPickupController;
  private readonly unsubPlayerDied: () => void;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    encounterId: string,
    private readonly center: { x: number; y: number },
    walls: Phaser.Tilemaps.TilemapLayer,
    private readonly hitboxes: HitboxManager,
    encounterScale?: EncounterScale,
  ) {
    const baseEncounter = getEncounterConfig(encounterId);
    const save = gameStore.getState().save;
    this.encounterScale =
      encounterScale ??
      (save
        ? resolveEncounterScale(
            getRealmOrder(save.realm.id),
            player.mapRecommendedRealmOrder,
            save.stats.level,
          )
        : resolveEncounterScale(1, 1, 1));
    this.encounter = scaleEncounterForPower(baseEncounter, this.encounterScale);
    this.maxAlive = this.encounterScale.maxAlive;

    this.pool = new CultivatorPool((cultivatorId) => {
      const cultivator = new Cultivator(scene, getCultivatorConfig(cultivatorId), {
        onStrike: (c) => this.resolveStrike(c),
        onDefeated: (c) => this.grantDefeatRewards(c),
        onDefeatHoldComplete: (c) => this.onDefeatHoldComplete(c),
        onBossPhaseSpawns: (c, adds) => this.queueBossAdds(c, adds),
      });
      scene.physics.add.collider(cultivator.sprite, walls);
      return cultivator;
    });

    const cultivatorIds = [
      ...new Set(this.encounter.waves.flatMap((w) => w.enemies.map((e) => e.id))),
    ];
    this.pool.prewarm(cultivatorIds);

    this.pickups = new CombatPickupController(scene, player);
    this.unsubPlayerDied = EventBus.on('player:died', () => this.onPlayerDied());
  }

  start(): void {
    this.startWave(0);
  }

  update(dtMs: number): void {
    const playerState = {
      x: this.player.x,
      y: this.player.y,
      alive: this.player.sm.state !== 'dead',
    };

    for (const cultivator of [...this.pool.aliveCultivators]) {
      cultivator.update(dtMs, playerState);
    }

    this.updateArrows(dtMs);
    this.pickups.update(dtMs);
  }

  /** Alive cultivators registered as hurtbox targets each frame. */
  getHurtboxTargets(): HurtboxEntity[] {
    return this.pool.combatReadyCultivators;
  }

  /** Combat-ready cultivators — for camera zoom director. */
  get combatReadyCount(): number {
    return this.pool.combatReadyCount;
  }

  get encounterTier() {
    return this.encounterScale.tier;
  }

  /** True when every wave was cleared and no enemies remain. */
  isEncounterComplete(): boolean {
    if (this.destroyed) return false;
    const lastWave = this.encounter.waves.length - 1;
    if (lastWave < 0) return true;
    return (
      this.waveIndex >= lastWave &&
      !this.waveActive &&
      this.queue.length === 0 &&
      this.pool.combatReadyCount === 0 &&
      this.pool.aliveCount === 0
    );
  }

  destroy(): void {
    this.destroyed = true;
    this.unsubPlayerDied();
    for (const arrow of this.arrows) arrow.img.destroy();
    this.arrows = [];
    this.pickups.destroy();
    this.pool.destroy();
  }

  get aliveCount(): number {
    return this.pool.aliveCount;
  }

  // --- waves ---

  private startWave(index: number): void {
    const wave = this.encounter.waves[index];
    if (!wave || this.destroyed) return;

    this.waveIndex = index;
    this.waveActive = true;
    this.queue = [];

    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        this.queue.push({
          cultivatorId: group.id,
          x: this.center.x + (Math.random() * 2 - 1) * group.spread,
          y: this.center.y + (Math.random() * 2 - 1) * group.spread,
        });
      }
    }

    this.fillFromQueue();
  }

  private fillFromQueue(): void {
    while (this.queue.length > 0 && this.pool.combatReadyCount < this.maxAlive) {
      const next = this.queue.shift();
      if (!next) break;
      this.pool.acquire(next.cultivatorId, next.x, next.y);
    }
  }

  private onDefeatHoldComplete(cultivator: Cultivator): void {
    if (this.destroyed || !this.waveActive) return;

    if (this.queue.length > 0) {
      this.pool.release(cultivator);
      this.fillFromQueue();
    } else if (this.isWaveFullyDefeated()) {
      this.finishWave();
      return;
    } else {
      cultivator.beginRecovery();
      return;
    }

    this.checkWaveProgress();
  }

  private isWaveFullyDefeated(): boolean {
    if (this.queue.length > 0) return false;
    const active = [...this.pool.aliveCultivators];
    return active.length > 0 && active.every((c) => c.defeated);
  }

  private checkWaveProgress(): void {
    if (!this.isWaveFullyDefeated()) return;
    this.finishWave();
  }

  private finishWave(): void {
    if (!this.waveActive) return;
    this.waveActive = false;
    for (const cultivator of [...this.pool.aliveCultivators]) {
      this.pool.release(cultivator);
    }

    EventBus.emit('map:wave-cleared', {
      encounterId: this.encounter.id,
      waveIndex: this.waveIndex,
    });

    if (this.waveIndex + 1 < this.encounter.waves.length) {
      this.scene.time.delayedCall(NEXT_WAVE_DELAY_MS, () => {
        this.startWave(this.waveIndex + 1);
      });
    }
  }

  private onPlayerDied(): void {
    this.pool.releaseAll();
    this.queue = [];
    this.waveActive = false;
    for (const arrow of this.arrows) arrow.img.destroy();
    this.arrows = [];

    const wave = this.waveIndex;
    this.scene.time.delayedCall(WAVE_RESET_DELAY_MS, () => {
      this.startWave(wave);
    });
  }

  // --- combat resolution ---

  private resolveStrike(cultivator: Cultivator): void {
    if (cultivator.config.archetype === 'ranged_kiter') {
      this.spawnArrow(cultivator);
      return;
    }

    if (cultivator.config.archetype === 'stationary') {
      this.flashAoeRing(cultivator);
    }

    this.hitboxes.spawn({
      ownerId: cultivator.id,
      team: 'cultivator',
      shape: {
        kind: 'circle',
        radius: cultivator.config.attackRange * MELEE_HIT_SLACK,
        x: cultivator.x,
        y: cultivator.y,
      },
      damage: {
        attacker: cultivator.stats.resolved,
        skillMultiplier: 1,
        damageType: 'physical',
      },
      lifetimeMs: STRIKE_MS,
      pierce: 1,
    });
  }

  private spawnArrow(cultivator: Cultivator): void {
    const img = this.scene.physics.add
      .image(cultivator.x, cultivator.y - 4, TEXTURE_KEYS.arrow)
      .setDepth(11);

    const angle = Phaser.Math.Angle.Between(cultivator.x, cultivator.y, this.player.x, this.player.y);
    img.setRotation(angle);
    this.scene.physics.velocityFromRotation(angle, ARROW_SPEED, img.body!.velocity);

    const hitbox = this.hitboxes.spawn({
      ownerId: cultivator.id,
      team: 'cultivator',
      shape: { kind: 'circle', radius: ARROW_HIT_RADIUS, x: img.x, y: img.y },
      damage: {
        attacker: cultivator.stats.resolved,
        skillMultiplier: 1,
        damageType: 'physical',
      },
      lifetimeMs: ARROW_TTL_MS,
      pierce: 1,
    });

    this.arrows.push({ img, hitboxId: hitbox.id, ttlMs: ARROW_TTL_MS });
  }

  private updateArrows(dtMs: number): void {
    this.arrows = this.arrows.filter((arrow) => {
      arrow.ttlMs -= dtMs;
      if (arrow.ttlMs <= 0 || !arrow.img.active) {
        arrow.img.destroy();
        return false;
      }

      const hitbox = this.hitboxes.getHitbox(arrow.hitboxId);
      if (hitbox) {
        this.hitboxes.setHitboxShape(arrow.hitboxId, {
          kind: 'circle',
          radius: ARROW_HIT_RADIUS,
          x: arrow.img.x,
          y: arrow.img.y,
        });
      }

      return true;
    });
  }

  // --- rewards ---

  private queueBossAdds(cultivator: Cultivator, adds: { id: string; count: number }[]): void {
    for (const group of adds) {
      for (let i = 0; i < group.count; i++) {
        const angle = (Math.PI * 2 * i) / Math.max(1, group.count);
        const dist = 48 + Math.random() * 24;
        this.queue.push({
          cultivatorId: group.id,
          x: cultivator.x + Math.cos(angle) * dist,
          y: cultivator.y + Math.sin(angle) * dist,
        });
      }
    }
    this.fillFromQueue();
  }

  private grantDefeatRewards(cultivator: Cultivator): void {
    const store = gameStore.getState();
    const save = store.save;
    if (!save) return;

    const bossClearId = cultivator.config.bossClearId;
    const wasRematch = Boolean(
      bossClearId && save.progress.clearedBosses.includes(bossClearId),
    );
    const isBoss = Boolean(bossClearId);

    const rewards = computeKillRewards(save, cultivator.config);
    const xpBefore = save.xp;

    store.patch((current) => {
      const bossClearId = cultivator.config.bossClearId;
      const clearedBosses =
        bossClearId && !current.progress.clearedBosses.includes(bossClearId)
          ? [...current.progress.clearedBosses, bossClearId]
          : current.progress.clearedBosses;

      const firstBossClear = Boolean(bossClearId && !wasRematch);

      let progress = {
        ...current.progress,
        clearedBosses,
        ...(rewards.bestiaryAdd
          ? { bestiary: [...current.progress.bestiary, rewards.bestiaryAdd] }
          : {}),
      };

      if (firstBossClear && bossClearId) {
        progress = {
          ...progress,
          journey: recordJourney(
            { ...current, progress },
            'boss',
            bossClearId,
            current.progress.currentMapId ?? null,
          ),
        };
      }

      const interim = {
        ...current,
        xp: rewards.xpTotal,
        ...(rewards.statsAfterLevelUp ? { stats: rewards.statsAfterLevelUp } : {}),
        progress,
      };

      let withUnlocks = interim;
      if (rewards.statsAfterLevelUp) {
        withUnlocks = unlockSkillsForLevel(withUnlocks, current.stats.level, rewards.statsAfterLevelUp.level);
      }
      if (bossClearId && !wasRematch) {
        withUnlocks = unlockSkillForBoss(withUnlocks, bossClearId);
      }

      // Grant destiny points on level-up: 1 unspent point per level-up
      const destinyPoints = current.destinyPoints ?? { dharma: 0, divine: 0, intent: 0, unspent: 0 };
      const unspentBonus = rewards.statsAfterLevelUp ? 1 : 0;
      const newDestinyPoints = {
        ...destinyPoints,
        unspent: destinyPoints.unspent + unspentBonus,
      };

      const { realm, emitReady } = syncRealmProgress(withUnlocks);
      if (emitReady) {
        EventBus.emit('realm:breakthrough-ready', undefined);
      }

      return {
        xp: rewards.xpTotal,
        ...(rewards.statsAfterLevelUp ? { stats: rewards.statsAfterLevelUp } : {}),
        unlockedSkills: withUnlocks.unlockedSkills,
        divineArts: withUnlocks.divineArts,
        realm,
        progress: withUnlocks.progress,
        destinyPoints: newDestinyPoints,
      };
    });

    if (rewards.statsAfterLevelUp) {
      this.player.stats.setBase(rewards.statsAfterLevelUp);
      this.player.stats.refill();
      this.player.emitStatsChanged();
    }

    emitKillProgressionEvents(rewards, xpBefore, gameStore.getState().save?.realm.id ?? save.realm.id);

    if (rewards.gold > 0) {
      this.pickups.spawnGold(cultivator.x, cultivator.y, rewards.gold);
    }

    const itemDrops = rollCultivatorLoot(cultivator.config, { isBoss, wasRematch });
    if (itemDrops.length > 0) {
      this.pickups.spawnItems(cultivator.x, cultivator.y, itemDrops);
    }

    EventBus.emit('map:cultivator-defeated', {
      cultivatorId: cultivator.config.id,
      isBoss,
      wasRematch,
    });
    // Back-compat for audio / juice listeners during migration.
    EventBus.emit('map:enemy-killed', {
      enemyId: cultivator.config.id,
      isBoss,
      wasRematch,
    });

    if (bossClearId && !wasRematch) {
      EventBus.emit('boss:defeated', { bossId: bossClearId });
    }
  }

  private flashAoeRing(cultivator: Cultivator): void {
    const ring = this.scene.add
      .circle(cultivator.x, cultivator.y, cultivator.config.attackRange)
      .setStrokeStyle(3, 0xd94a3a, 0.8)
      .setDepth(8);
    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.08,
      duration: 250,
      onComplete: () => ring.destroy(),
    });
  }
}
