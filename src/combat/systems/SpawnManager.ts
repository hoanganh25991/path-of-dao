import Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import type { Player } from '@/combat/entities/Player';
import { Enemy, STRIKE_MS } from '@/combat/entities/Enemy';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import { getEncounterConfig, getEnemyConfig } from '@/combat/enemies/EnemyLoader';
import type { EncounterConfig } from '@/combat/enemies/EnemyConfig';
import { EnemyPool } from '@/combat/systems/EnemyPool';
import { computeKillRewards } from '@/combat/systems/rewards';
import { syncRealmProgress } from '@/progression/BreakthroughManager';
import { unlockSkillForBoss, unlockSkillsForLevel } from '@/progression/SkillUnlockManager';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';

export const MAX_ALIVE = 18;
const NEXT_WAVE_DELAY_MS = 1500;
const WAVE_RESET_DELAY_MS = 1700;
const MELEE_HIT_SLACK = 1.3;

const ARROW_SPEED = 300;
const ARROW_TTL_MS = 2000;
const ARROW_HIT_RADIUS = 16;

const PICKUP_MAGNET_DELAY_MS = 500;
const PICKUP_MAGNET_RANGE = 60;
const PICKUP_MAGNET_SPEED = 280;
const PICKUP_COLLECT_RADIUS = 18;

interface QueuedSpawn {
  enemyId: string;
  x: number;
  y: number;
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

/**
 * Owns the map's encounter: wave spawning (max 8 alive, queue overflow),
 * enemy strike hitboxes, arrows, gold pickups, and kill rewards.
 */
export class SpawnManager {
  private readonly pool: EnemyPool;
  private readonly encounter: EncounterConfig;
  private queue: QueuedSpawn[] = [];
  private waveIndex = -1;
  private waveActive = false;
  private arrows: Arrow[] = [];
  private pickups: GoldPickup[] = [];
  private readonly unsubPlayerDied: () => void;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    encounterId: string,
    private readonly center: { x: number; y: number },
    walls: Phaser.Tilemaps.TilemapLayer,
    private readonly hitboxes: HitboxManager,
  ) {
    this.encounter = getEncounterConfig(encounterId);

    this.pool = new EnemyPool((enemyId) => {
      const enemy = new Enemy(scene, getEnemyConfig(enemyId), {
        onStrike: (e) => this.resolveStrike(e),
        onDeath: (e) => this.grantKillRewards(e),
        onDeathAnimComplete: (e) => this.releaseAndRefill(e),
        onBossPhaseSpawns: (e, adds) => this.queueBossAdds(e, adds),
      });
      scene.physics.add.collider(enemy.sprite, walls);
      return enemy;
    });

    const enemyIds = [
      ...new Set(this.encounter.waves.flatMap((w) => w.enemies.map((e) => e.id))),
    ];
    this.pool.prewarm(enemyIds);

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

    for (const enemy of [...this.pool.aliveEnemies]) {
      enemy.update(dtMs, playerState);
    }

    this.updateArrows(dtMs);
    this.updatePickups(dtMs);
  }

  /** Alive enemies registered as hurtbox targets each frame. */
  getHurtboxTargets(): HurtboxEntity[] {
    return [...this.pool.aliveEnemies].filter((e) => e.alive);
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
      this.pool.aliveCount === 0
    );
  }

  destroy(): void {
    this.destroyed = true;
    this.unsubPlayerDied();
    for (const arrow of this.arrows) arrow.img.destroy();
    this.arrows = [];
    for (const pickup of this.pickups) pickup.img.destroy();
    this.pickups = [];
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
          enemyId: group.id,
          x: this.center.x + (Math.random() * 2 - 1) * group.spread,
          y: this.center.y + (Math.random() * 2 - 1) * group.spread,
        });
      }
    }

    this.fillFromQueue();
  }

  private fillFromQueue(): void {
    while (this.queue.length > 0 && this.pool.aliveCount < MAX_ALIVE) {
      const next = this.queue.shift();
      if (!next) break;
      this.pool.acquire(next.enemyId, next.x, next.y);
    }
  }

  private releaseAndRefill(enemy: Enemy): void {
    this.pool.release(enemy);
    if (this.destroyed || !this.waveActive) return;

    this.fillFromQueue();

    if (this.queue.length === 0 && this.pool.aliveCount === 0) {
      this.waveActive = false;
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

  private resolveStrike(enemy: Enemy): void {
    if (enemy.config.archetype === 'ranged_kiter') {
      this.spawnArrow(enemy);
      return;
    }

    if (enemy.config.archetype === 'stationary') {
      this.flashAoeRing(enemy);
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

  // --- rewards ---

  private queueBossAdds(enemy: Enemy, adds: { id: string; count: number }[]): void {
    for (const group of adds) {
      for (let i = 0; i < group.count; i++) {
        const angle = (Math.PI * 2 * i) / Math.max(1, group.count);
        const dist = 48 + Math.random() * 24;
        this.queue.push({
          enemyId: group.id,
          x: enemy.x + Math.cos(angle) * dist,
          y: enemy.y + Math.sin(angle) * dist,
        });
      }
    }
    this.fillFromQueue();
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
      const bossClearId = enemy.config.bossClearId;
      const clearedBosses =
        bossClearId && !current.progress.clearedBosses.includes(bossClearId)
          ? [...current.progress.clearedBosses, bossClearId]
          : current.progress.clearedBosses;

      const interim = {
        ...current,
        xp: rewards.xpTotal,
        ...(rewards.statsAfterLevelUp ? { stats: rewards.statsAfterLevelUp } : {}),
        progress: {
          ...current.progress,
          clearedBosses,
          ...(rewards.bestiaryAdd
            ? { bestiary: [...current.progress.bestiary, rewards.bestiaryAdd] }
            : {}),
        },
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

  private flashAoeRing(enemy: Enemy): void {
    const ring = this.scene.add
      .circle(enemy.x, enemy.y, enemy.config.attackRange)
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
