import Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import type { Player } from '@/combat/entities/Player';
import { Cultivator } from '@/combat/entities/Cultivator';
import { dispatchAttackShape } from '@/combat/cultivators/attackTiming';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import { getCultivatorConfig } from '@/combat/cultivators/CultivatorLoader';
import type { RoamConfig } from '@/combat/map/RoamConfig';
import { CultivatorPool } from '@/combat/systems/CultivatorPool';
import { shouldDespawnOnDefeat } from '@/combat/systems/defeatRouting';
import { computeKillRewards } from '@/combat/systems/rewards';
import { rollCultivatorLoot } from '@/combat/systems/lootRoll';
import { CombatPickupController } from '@/combat/systems/CombatPickupController';
import { syncRealmProgress } from '@/progression/BreakthroughManager';
import { emitKillProgressionEvents } from '@/combat/systems/killProgressionEvents';
import { recordJourney } from '@/progression/JourneyLog';
import { unlockSkillForBoss, unlockSkillsForLevel } from '@/progression/SkillUnlockManager';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import {
  buildRoamingRankConfig,
  computeRoamingRank,
  type RoamingRankConfig,
} from '@/combat/systems/RoamingRankScaler';

const MELEE_HIT_SLACK = 1.3;
const ARROW_SPEED = 300;
const ARROW_TTL_MS = 2000;
const ARROW_HIT_RADIUS = 16;

interface RoamSlot {
  cultivatorId: string;
  x: number;
  y: number;
  respawnMs: number;
  patrolRadius: number;
  cultivator: Cultivator | null;
  respawnTimer: Phaser.Time.TimerEvent | null;
  /** Random pool — optional variety. */
  enemyPool: string[] | null;
}

interface Arrow {
  img: Phaser.Physics.Arcade.Image;
  hitboxId: string;
  ttlMs: number;
}

/** Placed roaming cultivators with in-place recovery — explore Tu Chân Tinh sub-zones. */
export class RoamingSpawnManager {
  private readonly pool: CultivatorPool;
  private readonly slots: RoamSlot[] = [];
  private arrows: Arrow[] = [];
  private pickups!: CombatPickupController;
  private destroyed = false;
  private readonly rankConfig: RoamingRankConfig;
  private readonly mapStartTimeMs: number;
  private readonly playerSpawnX: number;
  private readonly playerSpawnY: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    roam: RoamConfig,
    walls: Phaser.Tilemaps.TilemapLayer,
    private readonly hitboxes: HitboxManager,
    /** Player's spawn point on the map — used for distance-based rank scaling. */
    playerSpawn: { x: number; y: number },
    recommendedRealmOrder = 1,
  ) {
    this.rankConfig = buildRoamingRankConfig(recommendedRealmOrder);
    this.mapStartTimeMs = scene.time.now;
    this.playerSpawnX = playerSpawn.x;
    this.playerSpawnY = playerSpawn.y;

    const prewarmIds = new Set<string>();
    for (const spawn of roam.spawns) {
      const ids = spawn.enemyPool?.length ? spawn.enemyPool : spawn.enemyId ? [spawn.enemyId] : [];
      for (const id of ids) prewarmIds.add(id);
    }

    this.pool = new CultivatorPool((cultivatorId) => {
      const cultivator = new Cultivator(scene, getCultivatorConfig(cultivatorId), {
        onStrike: (c) => this.resolveStrike(c),
        onDefeated: (c) => this.grantDefeatRewards(c),
        onDefeatHoldComplete: (c) => this.onDefeatHoldComplete(c),
      });
      scene.physics.add.collider(cultivator.sprite, walls);
      return cultivator;
    });
    this.pool.prewarm([...prewarmIds]);
    this.pickups = new CombatPickupController(scene, player);

    for (const spawn of roam.spawns) {
      const id = spawn.enemyId ?? spawn.enemyPool?.[0] ?? '';
      this.slots.push({
        cultivatorId: id,
        x: spawn.x,
        y: spawn.y,
        respawnMs: spawn.respawnMs,
        patrolRadius: spawn.patrolRadius,
        cultivator: null,
        respawnTimer: null,
        enemyPool: spawn.enemyPool ?? null,
      });
    }

    for (const slot of this.slots) {
      this.activateSlot(slot);
    }
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

  getHurtboxTargets(): HurtboxEntity[] {
    return this.pool.combatReadyCultivators;
  }

  get combatReadyCount(): number {
    return this.pool.combatReadyCount;
  }

  /** Explore maps — retreat anytime; no wave gate. */
  isEncounterComplete(): boolean {
    return !this.destroyed;
  }

  destroy(): void {
    this.destroyed = true;
    for (const slot of this.slots) {
      slot.respawnTimer?.remove(false);
      slot.respawnTimer = null;
    }
    for (const arrow of this.arrows) arrow.img.destroy();
    this.arrows = [];
    this.pickups.destroy();
    this.pool.destroy();
  }

  private activateSlot(slot: RoamSlot): void {
    if (this.destroyed) return;
    slot.respawnTimer?.remove(false);
    slot.respawnTimer = null;

    // Pick from enemy pool if available — biased toward higher index at higher rank
    const elapsedSec = (this.scene.time.now - this.mapStartTimeMs) / 1000;
    const distPx = Phaser.Math.Distance.Between(this.playerSpawnX, this.playerSpawnY, slot.x, slot.y);
    const rankResult = computeRoamingRank(distPx, elapsedSec, this.rankConfig);

    let pickId = slot.cultivatorId;
    if (slot.enemyPool && slot.enemyPool.length > 0) {
      const bias = Math.min(rankResult.rank, slot.enemyPool.length - 1);
      pickId = slot.enemyPool[bias] ?? slot.cultivatorId;
    }

    const cultivator = this.pool.acquire(pickId, slot.x, slot.y);
    cultivator.setRecoveryDuration(slot.respawnMs);
    if (slot.patrolRadius > 0) {
      const r = slot.patrolRadius;
      cultivator.setPatrolWaypoints([
        { x: 0, y: 0 },
        { x: r, y: 0 },
        { x: r, y: r * 0.6 },
        { x: 0, y: r * 0.6 },
      ]);
    }
    slot.cultivator = cultivator;

    if (rankResult.rank > 0) {
      cultivator.setRank(rankResult);
    }
  }

  private onDefeatHoldComplete(cultivator: Cultivator): void {
    const slot = this.slots.find((s) => s.cultivator === cultivator);
    if (!slot || this.destroyed) return;
    // Boss slots stay down for the session; beasts despawn to pool on defeat —
    // no gather-qi sit-recover (combat-defeat-canon.md §1).
    if (shouldDespawnOnDefeat(cultivator)) {
      this.pool.release(cultivator);
      slot.cultivator = null;
      return;
    }
    cultivator.beginRecovery();
  }

  private resolveStrike(cultivator: Cultivator): void {
    const shape = dispatchAttackShape(cultivator.config.archetype, cultivator.effectiveAttackShape);

    if (shape === 'projectile') {
      this.spawnArrow(cultivator);
      return;
    }

    if (shape === 'aoe_ring') {
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
      lifetimeMs: cultivator.effectiveStrikeMs,
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
    EventBus.emit('map:enemy-killed', {
      enemyId: cultivator.config.id,
      isBoss,
      wasRematch,
    });

    if (bossClearId && !wasRematch) {
      EventBus.emit('boss:defeated', { bossId: bossClearId });
    }
  }
}
