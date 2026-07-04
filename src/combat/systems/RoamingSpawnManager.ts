import Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import type { Player } from '@/combat/entities/Player';
import { Enemy, STRIKE_MS } from '@/combat/entities/Enemy';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import { getEnemyConfig } from '@/combat/enemies/EnemyLoader';
import type { RoamConfig } from '@/combat/map/RoamConfig';
import { EnemyPool } from '@/combat/systems/EnemyPool';
import { computeKillRewards } from '@/combat/systems/rewards';
import { syncRealmProgress } from '@/progression/BreakthroughManager';
import { recordJourney } from '@/progression/JourneyLog';
import { unlockSkillForBoss, unlockSkillsForLevel } from '@/progression/SkillUnlockManager';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import { PatrolAI } from '@/combat/ai/PatrolAI';

const MELEE_HIT_SLACK = 1.3;
const ARROW_SPEED = 300;
const ARROW_TTL_MS = 2000;
const ARROW_HIT_RADIUS = 16;
const PICKUP_MAGNET_DELAY_MS = 500;
const PICKUP_MAGNET_RANGE = 60;
const PICKUP_MAGNET_SPEED = 280;
const PICKUP_COLLECT_RADIUS = 18;

interface RoamSlot {
  enemyId: string;
  x: number;
  y: number;
  respawnMs: number;
  patrolRadius: number;
  enemy: Enemy | null;
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

/** Placed roaming enemies with respawn — explore Tu Chân Tinh sub-zones. */
export class RoamingSpawnManager {
  private readonly pool: EnemyPool;
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
    const enemyIds = [...new Set(roam.spawns.map((s) => s.enemyId))];
    this.pool = new EnemyPool((enemyId) => {
      const enemy = new Enemy(scene, getEnemyConfig(enemyId), {
        onStrike: (e) => this.resolveStrike(e),
        onDeath: (e) => this.grantKillRewards(e),
        onDeathAnimComplete: (e) => this.onDeathAnimComplete(e),
      });
      scene.physics.add.collider(enemy.sprite, walls);
      return enemy;
    });
    this.pool.prewarm(enemyIds);

    for (const spawn of roam.spawns) {
      this.slots.push({
        enemyId: spawn.enemyId,
        x: spawn.x,
        y: spawn.y,
        respawnMs: spawn.respawnMs,
        patrolRadius: spawn.patrolRadius,
        enemy: null,
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

    for (const enemy of [...this.pool.aliveEnemies]) {
      enemy.update(dtMs, playerState);
    }

    this.updateArrows(dtMs);
    this.updatePickups(dtMs);
  }

  getHurtboxTargets(): HurtboxEntity[] {
    return [...this.pool.aliveEnemies].filter((e) => e.alive);
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

    const enemy = this.pool.acquire(slot.enemyId, slot.x, slot.y);
    if (slot.patrolRadius > 0) {
      const r = slot.patrolRadius;
      (enemy as unknown as { brain: PatrolAI }).brain = new PatrolAI([
        { x: 0, y: 0 },
        { x: r, y: 0 },
        { x: r, y: r * 0.6 },
        { x: 0, y: r * 0.6 },
      ]);
    }
    slot.enemy = enemy;
  }

  private onDeathAnimComplete(enemy: Enemy): void {
    const slot = this.slots.find((s) => s.enemy === enemy);
    this.pool.release(enemy);
    if (slot) {
      slot.enemy = null;
      if (!this.destroyed) {
        slot.respawnTimer = this.scene.time.delayedCall(slot.respawnMs, () => {
          this.activateSlot(slot);
        });
      }
    }
  }

  private resolveStrike(enemy: Enemy): void {
    if (enemy.config.archetype === 'ranged_kiter') {
      this.spawnArrow(enemy);
      return;
    }

    this.hitboxes.spawn({
      ownerId: enemy.id,
      team: 'enemy',
      shape: {
        kind: 'circle',
        radius: enemy.config.attackRange * MELEE_HIT_SLACK,
        x: enemy.x,
        y: enemy.y,
      },
      damage: {
        attacker: enemy.stats.resolved,
        skillMultiplier: 1,
        damageType: 'physical',
      },
      lifetimeMs: STRIKE_MS,
      pierce: 1,
    });
  }

  private spawnArrow(enemy: Enemy): void {
    const img = this.scene.physics.add
      .image(enemy.x, enemy.y - 4, TEXTURE_KEYS.arrow)
      .setDepth(11);

    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    img.setRotation(angle);
    this.scene.physics.velocityFromRotation(angle, ARROW_SPEED, img.body!.velocity);

    const hitbox = this.hitboxes.spawn({
      ownerId: enemy.id,
      team: 'enemy',
      shape: { kind: 'circle', radius: ARROW_HIT_RADIUS, x: img.x, y: img.y },
      damage: {
        attacker: enemy.stats.resolved,
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

  private grantKillRewards(enemy: Enemy): void {
    const store = gameStore.getState();
    const save = store.save;
    if (!save) return;

    const bossClearId = enemy.config.bossClearId;
    const wasRematch = Boolean(
      bossClearId && save.progress.clearedBosses.includes(bossClearId),
    );
    const isBoss = Boolean(bossClearId);
    const rewards = computeKillRewards(save, enemy.config);

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
      EventBus.emit('progression:level-up', { level: rewards.statsAfterLevelUp.level });
    }

    if (rewards.gold > 0) {
      this.spawnGoldPickup(enemy.x, enemy.y, rewards.gold);
    }

    EventBus.emit('map:enemy-killed', {
      enemyId: enemy.config.id,
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
  }
}
