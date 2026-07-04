import Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { gameStore } from '@/core/store/gameStore';
import type { Player } from '@/combat/entities/Player';
import { Cultivator, STRIKE_MS } from '@/combat/entities/Cultivator';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import { getCultivatorConfig } from '@/combat/cultivators/CultivatorLoader';
import type { RoamConfig } from '@/combat/map/RoamConfig';
import { CultivatorPool } from '@/combat/systems/CultivatorPool';
import { computeKillRewards } from '@/combat/systems/rewards';
import { syncRealmProgress } from '@/progression/BreakthroughManager';
import { emitKillProgressionEvents } from '@/combat/systems/killProgressionEvents';
import { recordJourney } from '@/progression/JourneyLog';
import { unlockSkillForBoss, unlockSkillsForLevel } from '@/progression/SkillUnlockManager';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';

const MELEE_HIT_SLACK = 1.3;
const ARROW_SPEED = 300;
const ARROW_TTL_MS = 2000;
const ARROW_HIT_RADIUS = 16;
const PICKUP_MAGNET_DELAY_MS = 500;
const PICKUP_MAGNET_RANGE = 60;
const PICKUP_MAGNET_SPEED = 280;
const PICKUP_COLLECT_RADIUS = 18;

interface RoamSlot {
  cultivatorId: string;
  x: number;
  y: number;
  respawnMs: number;
  patrolRadius: number;
  cultivator: Cultivator | null;
  respawnTimer: Phaser.Time.TimerEvent | null;
}

interface Arrow {
  img: Phaser.Physics.Arcade.Image;
  hitboxId: string;
  ttlMs: number;
}

interface GoldPickup {
  img: Phaser.GameObjects.Image;
  value: number;
  ageMs: number;
}

/** Placed roaming cultivators with in-place recovery — explore Tu Chân Tinh sub-zones. */
export class RoamingSpawnManager {
  private readonly pool: CultivatorPool;
  private readonly slots: RoamSlot[] = [];
  private arrows: Arrow[] = [];
  private pickups: GoldPickup[] = [];
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    roam: RoamConfig,
    walls: Phaser.Tilemaps.TilemapLayer,
    private readonly hitboxes: HitboxManager,
  ) {
    const cultivatorIds = [...new Set(roam.spawns.map((s) => s.enemyId))];
    this.pool = new CultivatorPool((cultivatorId) => {
      const cultivator = new Cultivator(scene, getCultivatorConfig(cultivatorId), {
        onStrike: (c) => this.resolveStrike(c),
        onDefeated: (c) => this.grantDefeatRewards(c),
        onDefeatHoldComplete: (c) => this.onDefeatHoldComplete(c),
      });
      scene.physics.add.collider(cultivator.sprite, walls);
      return cultivator;
    });
    this.pool.prewarm(cultivatorIds);

    for (const spawn of roam.spawns) {
      this.slots.push({
        cultivatorId: spawn.enemyId,
        x: spawn.x,
        y: spawn.y,
        respawnMs: spawn.respawnMs,
        patrolRadius: spawn.patrolRadius,
        cultivator: null,
        respawnTimer: null,
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
    this.updatePickups(dtMs);
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
    for (const pickup of this.pickups) pickup.img.destroy();
    this.pickups = [];
    this.pool.destroy();
  }

  private activateSlot(slot: RoamSlot): void {
    if (this.destroyed) return;
    slot.respawnTimer?.remove(false);
    slot.respawnTimer = null;

    const cultivator = this.pool.acquire(slot.cultivatorId, slot.x, slot.y);
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
  }

  private onDefeatHoldComplete(cultivator: Cultivator): void {
    const slot = this.slots.find((s) => s.cultivator === cultivator);
    if (!slot || this.destroyed) return;
    cultivator.beginRecovery();
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
        withUnlocks = unlockSkillsForLevel(withUnlocks, rewards.statsAfterLevelUp.level);
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
        equippedSkills: withUnlocks.equippedSkills,
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
      this.spawnGoldPickup(cultivator.x, cultivator.y, rewards.gold);
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

  private spawnGoldPickup(x: number, y: number, value: number): void {
    const img = this.scene.add
      .image(x + (Math.random() * 16 - 8), y + (Math.random() * 16 - 8), TEXTURE_KEYS.coin)
      .setDepth(8);
    this.pickups.push({ img, value, ageMs: 0 });
  }

  private updatePickups(dtMs: number): void {
    this.pickups = this.pickups.filter((pickup) => {
      pickup.ageMs += dtMs;
      if (pickup.ageMs < PICKUP_MAGNET_DELAY_MS) return true;

      const dist = Phaser.Math.Distance.Between(
        pickup.img.x,
        pickup.img.y,
        this.player.x,
        this.player.y,
      );

      if (dist <= PICKUP_COLLECT_RADIUS) {
        this.collectGold(pickup.value);
        pickup.img.destroy();
        return false;
      }

      if (dist <= PICKUP_MAGNET_RANGE) {
        const step = (PICKUP_MAGNET_SPEED * dtMs) / 1000;
        const angle = Math.atan2(this.player.y - pickup.img.y, this.player.x - pickup.img.x);
        pickup.img.x += Math.cos(angle) * step;
        pickup.img.y += Math.sin(angle) * step;
      }
      return true;
    });
  }

  private collectGold(value: number): void {
    const store = gameStore.getState();
    if (!store.save) return;
    store.patch((current) => ({
      inventory: { ...current.inventory, gold: current.inventory.gold + value },
    }));
    AudioDirector.playLootPickup();
  }
}
