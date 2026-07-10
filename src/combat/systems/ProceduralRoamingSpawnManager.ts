import Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import type { Player } from '@/combat/entities/Player';
import { Cultivator, STRIKE_MS } from '@/combat/entities/Cultivator';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import { getCultivatorConfig } from '@/combat/cultivators/CultivatorLoader';
import type { ProceduralWorldConfig } from '@/combat/world/ProceduralWorldConfig';
import {
  cellKey,
  generateCellLayout,
  type GeneratedSpawn,
} from '@/combat/world/ProceduralCellGenerator';
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
  buildProceduralRankConfig,
  computeProceduralRank,
  type ProceduralRankConfig,
} from '@/combat/systems/RoamingRankScaler';

const MELEE_HIT_SLACK = 1.3;
const ARROW_SPEED = 300;
const ARROW_TTL_MS = 2000;
const ARROW_HIT_RADIUS = 16;
const ACTIVE_CELL_RADIUS = 3;
const DEFAULT_RESPAWN_MS = 54_000;

interface CellSlot extends GeneratedSpawn {
  cellX: number;
  cellY: number;
  cultivator: Cultivator | null;
  defeated: boolean;
}

interface Arrow {
  img: Phaser.Physics.Arcade.Image;
  hitboxId: string;
  ttlMs: number;
}

/**
 * Endless roam — cultivators spawn in deterministic grid cells around the player.
 * Revisit the same coordinates → same enemies. Bosses can appear anywhere (after min distance).
 */
export class ProceduralRoamingSpawnManager {
  private readonly pool: CultivatorPool;
  private readonly slots = new Map<string, CellSlot[]>();
  private readonly layouts = new Map<string, ReturnType<typeof generateCellLayout>>();
  private arrows: Arrow[] = [];
  private pickups!: CombatPickupController;
  private destroyed = false;
  private readonly rankConfig: ProceduralRankConfig;
  private readonly mapStartTimeMs: number;
  private lastPlayerCellX = Number.NaN;
  private lastPlayerCellY = Number.NaN;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly profile: ProceduralWorldConfig,
    private readonly worldSeed: number,
    private readonly originX: number,
    private readonly originY: number,
    walls: Phaser.Tilemaps.TilemapLayer | null,
    private readonly hitboxes: HitboxManager,
    recommendedRealmOrder = 1,
    recommendedCp = 800,
  ) {
    this.rankConfig = buildProceduralRankConfig(
      recommendedCp,
      recommendedRealmOrder,
      profile.cellSize,
    );
    this.mapStartTimeMs = scene.time.now;

    const prewarm = new Set<string>([
      ...profile.mobPool,
      ...profile.strongPool,
      ...profile.bossPool,
    ]);

    this.pool = new CultivatorPool((cultivatorId) => {
      const cultivator = new Cultivator(scene, getCultivatorConfig(cultivatorId), {
        onStrike: (c) => this.resolveStrike(c),
        onDefeated: (c) => this.grantDefeatRewards(c),
        onDefeatHoldComplete: (c) => this.onDefeatHoldComplete(c),
      });
      if (walls) {
        scene.physics.add.collider(cultivator.sprite, walls);
      }
      return cultivator;
    });
    this.pool.prewarm([...prewarm]);
    this.pickups = new CombatPickupController(scene, player);
  }

  update(dtMs: number): void {
    this.syncActiveCells();

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

  isEncounterComplete(): boolean {
    return !this.destroyed;
  }

  destroy(): void {
    this.destroyed = true;
    for (const arrow of this.arrows) arrow.img.destroy();
    this.arrows = [];
    this.pickups.destroy();
    this.pool.destroy();
    this.slots.clear();
    this.layouts.clear();
  }

  private playerCell(): { x: number; y: number } {
    const cellSize = this.profile.cellSize;
    return {
      x: Math.floor((this.player.x - this.originX) / cellSize),
      y: Math.floor((this.player.y - this.originY) / cellSize),
    };
  }

  private syncActiveCells(): void {
    const { x: pcx, y: pcy } = this.playerCell();
    if (pcx === this.lastPlayerCellX && pcy === this.lastPlayerCellY) return;
    this.lastPlayerCellX = pcx;
    this.lastPlayerCellY = pcy;

    const keep = new Set<string>();
    for (let dx = -ACTIVE_CELL_RADIUS; dx <= ACTIVE_CELL_RADIUS; dx++) {
      for (let dy = -ACTIVE_CELL_RADIUS; dy <= ACTIVE_CELL_RADIUS; dy++) {
        const cx = pcx + dx;
        const cy = pcy + dy;
        const key = cellKey(cx, cy);
        keep.add(key);
        this.ensureCell(cx, cy);
      }
    }

    for (const key of [...this.slots.keys()]) {
      if (!keep.has(key)) {
        this.despawnCell(key);
      }
    }
  }

  private ensureCell(cellX: number, cellY: number): void {
    const key = cellKey(cellX, cellY);
    if (this.slots.has(key)) return;

    let layout = this.layouts.get(key);
    if (!layout) {
      layout = generateCellLayout(
        this.worldSeed,
        cellX,
        cellY,
        this.profile,
        this.originX,
        this.originY,
      );
      this.layouts.set(key, layout);
    }
    if (!layout || layout.spawns.length === 0) {
      this.slots.set(key, []);
      return;
    }

    const cellSlots: CellSlot[] = layout.spawns.map((spawn) => ({
      ...spawn,
      cellX,
      cellY,
      cultivator: null,
      defeated: false,
    }));

    for (const slot of cellSlots) {
      this.activateSlot(slot);
    }
    this.slots.set(key, cellSlots);
  }

  private despawnCell(key: string): void {
    const cellSlots = this.slots.get(key);
    if (!cellSlots) return;
    for (const slot of cellSlots) {
      if (slot.cultivator) {
        this.pool.release(slot.cultivator);
        slot.cultivator = null;
      }
    }
    this.slots.delete(key);
  }

  private activateSlot(slot: CellSlot): void {
    if (this.destroyed || slot.defeated || slot.cultivator) return;

    const elapsedSec = (this.scene.time.now - this.mapStartTimeMs) / 1000;
    const distPx = Phaser.Math.Distance.Between(this.originX, this.originY, slot.x, slot.y);
    const cellDist = Math.max(Math.abs(slot.cellX), Math.abs(slot.cellY));
    const rankResult = computeProceduralRank(
      distPx,
      elapsedSec,
      cellDist,
      slot.bonusRank,
      slot.kind,
      this.rankConfig,
    );

    const cultivator = this.pool.acquire(slot.enemyId, slot.x, slot.y);
    const isBoss = Boolean(cultivator.config.bossClearId);
    cultivator.setRecoveryDuration(isBoss ? 999_999 : DEFAULT_RESPAWN_MS);

    if (slot.patrolRadius > 0) {
      const r = slot.patrolRadius;
      cultivator.setPatrolWaypoints([
        { x: 0, y: 0 },
        { x: r, y: 0 },
        { x: r, y: r * 0.6 },
        { x: 0, y: r * 0.6 },
      ]);
    }

    if (rankResult.rank > 0 || rankResult.statMultiplier > 1.05) {
      cultivator.setRank(rankResult);
    }

    slot.cultivator = cultivator;
  }

  private onDefeatHoldComplete(cultivator: Cultivator): void {
    for (const cellSlots of this.slots.values()) {
      const slot = cellSlots.find((s) => s.cultivator === cultivator);
      if (!slot) continue;

      // Boss slots stay down for the session; beasts despawn to pool on defeat —
      // no gather-qi sit-recover (combat-defeat-canon.md §1).
      if (shouldDespawnOnDefeat(cultivator)) {
        slot.defeated = true;
        this.pool.release(cultivator);
        slot.cultivator = null;
        return;
      }

      cultivator.beginRecovery();
      return;
    }
  }

  private resolveStrike(cultivator: Cultivator): void {
    if (cultivator.config.archetype === 'ranged_kiter') {
      this.spawnArrow(cultivator);
      return;
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
