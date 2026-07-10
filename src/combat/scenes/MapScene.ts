import Phaser from 'phaser';
import { SceneRouter } from '@/app/SceneRouter';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { SaveManager } from '@/core/save/SaveManager';
import { applyMapClearPatch } from '@/progression/ChapterManager';
import { showTimelineOfferModal } from '@/ui/modals/TimelineOfferModal';
import { openTimelineShardReader } from '@/ui/story/TimelineShardReader';
import { I18nManager } from '@/core/i18n/I18nManager';
import { exitAncientDemo, getActiveAncientId, getAncientProfile } from '@/progression/AncientDemoManager';
import { applyAncientGodMode, isAncientCombatActive } from '@/progression/AncientCombatMode';
import {
  getPathWalkTimelineShardId,
  isPathWalkActive,
  markPathWalkTimelineShardSeen,
  onPathStepMapCleared,
  routePathWalk,
} from '@/progression/PathWalkManager';
import { EquipmentManager } from '@/progression/EquipmentManager';
import { resolveAttackStyle } from '@/progression/WeaponProgression';
import { registerHeroCombatAssets } from '@/combat/art/stickyManAssets';
import { StatSheet } from '@/progression/StatSheet';
import { getRealmOrder } from '@/progression/RealmStatScaling';
import { getMapConfig } from '@/combat/map/MapLoader';
import type { MapConfig } from '@/combat/map/MapConfig';
import { CollisionLayer } from '@/combat/map/CollisionLayer';
import { Player } from '@/combat/entities/Player';
import { SpawnManager } from '@/combat/systems/SpawnManager';
import { RoamingSpawnManager } from '@/combat/systems/RoamingSpawnManager';
import { ProceduralRoamingSpawnManager } from '@/combat/systems/ProceduralRoamingSpawnManager';
import { ZonePortalManager } from '@/combat/systems/ZonePortalManager';
import { resolvePortalSpawn } from '@/combat/map/portalSpawn';
import { getRoamConfig } from '@/combat/map/RoamLoader';
import { getWorldProfile, worldSeedForMap } from '@/combat/world/ProceduralWorldLoader';
import { resolveGroundPalette } from '@/combat/world/GroundPalette';
import {
  generateSettlementPlacements,
  generateSignatureTreePlacement,
} from '@/combat/world/ProceduralSettlementGenerator';
import { EndlessGroundManager } from '@/combat/map/EndlessGround';
import { WorldFogOverlay } from '@/combat/map/WorldFog';
import { SettlementDecorator } from '@/combat/map/SettlementDecorator';
import { biomeGroundColor } from '@/combat/map/biomeGroundColor';
import { AudioManager } from '@/core/audio/AudioManager';
import { EncounterTrigger } from '@/combat/systems/EncounterTrigger';
import { HitboxManager } from '@/combat/combat/HitboxManager';
import { tilemapKey } from '@/combat/scenes/BootScene';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import { STRUCTURE_TEXTURES } from '@/combat/art/structures/StructureRegistry';
import { getQualitySettingsFromSave } from '@/app/QualityProfile';
import { CombatJuiceBridge } from '@/combat/juice/CombatJuiceBridge';
import { JuiceController } from '@/combat/juice/JuiceController';
import { CombatCameraDirector } from '@/combat/camera/CombatCameraDirector';

const CAMERA_LERP = 0.08;
const CAMERA_DEADZONE = 100;
const COMBAT_ZOOM = 0.88;
const ANCIENT_COMBAT_ZOOM = 0.72;
/** Open-world extent — player can roam freely within ± this range from origin. */
const WORLD_EXTENT = 480_000;

const DEPTH = {
  ground: 0,
  decoration: 2,
  player: 10,
  foreground: 100,
} as const;

/** Main gameplay scene: tilemap, collision, player, camera, dev exit. */
export class MapScene extends Phaser.Scene {
  static readonly KEY = 'MapScene';

  private mapId = '';
  private spawnFromPortal?: string;
  private player!: Player;
  private hitboxManager!: HitboxManager;
  private spawnManager: SpawnManager | RoamingSpawnManager | ProceduralRoamingSpawnManager | null = null;
  private endlessGround: EndlessGroundManager | null = null;
  private worldFog: WorldFogOverlay | null = null;
  private settlementDecorator: SettlementDecorator | null = null;
  private zonePortalManager: ZonePortalManager | null = null;
  private encounterTrigger: EncounterTrigger | null = null;
  private exiting = false;
  private runtimePersisted = false;
  private juiceBridge: CombatJuiceBridge | null = null;
  private cameraDirector: CombatCameraDirector | null = null;
  private unsubscribeCombatEvents: (() => void) | null = null;
  private exitPortalRevealed = false;
  private exitZone: Phaser.GameObjects.Zone | null = null;
  private exitVisuals: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];
  /** Session flag — boss ordeal roam maps gate the depart portal until set. */
  private bossOrdealCleared = false;

  constructor() {
    super(MapScene.KEY);
  }

  init(data: { mapId: string; spawnFromPortal?: string }): void {
    this.mapId = data.mapId;
    this.spawnFromPortal = data.spawnFromPortal;
  }

  create(): void {
    // Idempotent setup — leaked EventBus listeners can fire after Phaser clears cameras.main.
    this.unsubscribeCombatEvents?.();
    this.unsubscribeCombatEvents = null;
    this.juiceBridge?.destroy();
    this.juiceBridge = null;
    this.cameraDirector = null;

    const config = getMapConfig(this.mapId);
    this.exiting = false;

    const map = this.make.tilemap({ key: tilemapKey(this.mapId) });
    const tileset = map.addTilesetImage(config.tilesetName, TEXTURE_KEYS.tileset);
    if (!tileset) {
      throw new Error(`MapScene: tileset "${config.tilesetName}" missing for "${this.mapId}"`);
    }

    const ground = map.createLayer('ground', tileset);
    const decoration = map.createLayer('decoration', tileset);
    const collision = map.createLayer('collision', tileset);
    const foreground = map.createLayer('foreground', tileset);
    if (
      !ground ||
      !decoration ||
      !foreground ||
      !(collision instanceof Phaser.Tilemaps.TilemapLayer)
    ) {
      throw new Error(`MapScene: missing tile layer in "${this.mapId}"`);
    }

    ground.setDepth(DEPTH.ground);
    decoration.setDepth(DEPTH.decoration);
    foreground.setDepth(DEPTH.foreground);
    CollisionLayer.apply(collision);

    const isProcedural = config.spawnMode === 'procedural';

    if (isProcedural) {
      ground.setVisible(false);
      decoration.setVisible(false);
      foreground.setVisible(false);
      collision.setVisible(false);
      this.physics.world.setBounds(-WORLD_EXTENT, -WORLD_EXTENT, WORLD_EXTENT * 2, WORLD_EXTENT * 2);
    } else {
      this.physics.world.setBounds(0, 0, config.bounds.width, config.bounds.height);
    }

    const spawn = this.resolveSpawn(map, config);
    this.hitboxManager = new HitboxManager(this);
    const save = gameStore.getState().save;
    const attackStyle = save ? resolveAttackStyle(save) : 'unarmed';
    registerHeroCombatAssets(this, attackStyle);
    this.player = new Player(this, spawn.x, spawn.y, this.buildStatSheet(), this.hitboxManager);
    this.player.sprite.setDepth(DEPTH.player);
    this.player.attackerRealmOrder = save ? getRealmOrder(save.realm.id) : 1;
    this.player.mapRecommendedRealmOrder = config.recommendedRealmOrder;
    if (save) {
      this.player.attackStyle = attackStyle;
    }
    if (!isProcedural) {
      this.physics.add.collider(this.player.sprite, collision);
    }

    if (isProcedural && config.worldProfile) {
      const worldProfile = getWorldProfile(config.worldProfile);
      const groundPalette = resolveGroundPalette(worldProfile);
      const seed = worldSeedForMap(this.mapId);
      const groundColor = biomeGroundColor(config.chapterId, groundPalette);
      this.endlessGround = new EndlessGroundManager(
        this,
        seed,
        groundPalette,
        config.tilesetName,
        groundColor,
        DEPTH.ground,
      );
      this.endlessGround.warmStart(spawn.x, spawn.y);

      this.settlementDecorator = new SettlementDecorator(this);
      this.settlementDecorator.renderSettlements(
        generateSettlementPlacements(seed, worldProfile, config.spawn.x, config.spawn.y),
      );
      this.settlementDecorator.renderSignatureTree(
        generateSignatureTreePlacement(seed, worldProfile, config.spawn.x, config.spawn.y),
      );
    } else {
      this.spawnEnvironmentDecorations(config);
    }

    if (isAncientCombatActive()) {
      const ancientId = getActiveAncientId();
      if (ancientId && save) {
        const profile = getAncientProfile(ancientId);
        this.player.applyAncientEcho(
          profile,
          I18nManager.t(profile.nameKey),
          I18nManager.t(profile.epithetKey),
        );
      }
    }

    const camera = this.cameras.main;
    camera.roundPixels = true;
    if (isProcedural) {
      const groundPalette =
        config.worldProfile != null
          ? resolveGroundPalette(getWorldProfile(config.worldProfile))
          : undefined;
      camera.setBackgroundColor(biomeGroundColor(config.chapterId, groundPalette));
      camera.setBounds(-WORLD_EXTENT, -WORLD_EXTENT, WORLD_EXTENT * 2, WORLD_EXTENT * 2);
    } else {
      camera.setBounds(0, 0, config.bounds.width, config.bounds.height);
    }
    const baseZoom = isAncientCombatActive() ? ANCIENT_COMBAT_ZOOM : COMBAT_ZOOM;
    camera.setZoom(baseZoom);
    camera.startFollow(this.player.sprite, true, CAMERA_LERP, CAMERA_LERP);
    camera.setDeadzone(CAMERA_DEADZONE, CAMERA_DEADZONE);
    this.cameraDirector = new CombatCameraDirector(camera, baseZoom);

    if (isProcedural && config.worldProfile) {
      const worldProfile = getWorldProfile(config.worldProfile);
      if (worldProfile.fog?.enabled) {
        this.worldFog = new WorldFogOverlay(this, camera, worldProfile.fog);
      }
    }

    this.createExitZone(map);
    this.subscribeCombatEvents();

    if (config.portals.length > 0) {
      this.zonePortalManager = new ZonePortalManager(this, this.player, map, config, () => {
        this.persistRuntime();
      });
    }

    if (config.spawnMode === 'procedural' && config.worldProfile) {
      try {
        const worldProfile = getWorldProfile(config.worldProfile);
        this.spawnManager = new ProceduralRoamingSpawnManager(
          this,
          this.player,
          worldProfile,
          worldSeedForMap(this.mapId),
          config.spawn.x,
          config.spawn.y,
          null,
          this.hitboxManager,
          config.recommendedRealmOrder,
          config.recommendedCp,
        );
      } catch (err) {
        console.error(`MapScene: failed to init ProceduralRoamingSpawnManager for "${this.mapId}":`, err);
      }
    } else if (config.spawnMode === 'roam' && config.roamTable) {
      try {
        const roam = getRoamConfig(config.roamTable);
        this.spawnManager = new RoamingSpawnManager(
          this,
          this.player,
          roam,
          collision,
          this.hitboxManager,
          { x: config.spawn.x, y: config.spawn.y },
          config.recommendedRealmOrder,
        );
      } catch (err) {
        console.error(`MapScene: failed to init RoamingSpawnManager for "${this.mapId}":`, err);
      }
    } else if (config.encounterTable) {
      try {
        this.spawnManager = new SpawnManager(
          this,
          this.player,
          config.encounterTable,
          this.resolveEncounterCenter(map, config),
          collision,
          this.hitboxManager,
        );
        this.spawnManager.start();
      } catch (err) {
        console.error(`MapScene: failed to init SpawnManager for "${this.mapId}":`, err);
      }
    }

    this.player.combat.setEnemyTargetProvider(
      () => this.spawnManager?.getHurtboxTargets() ?? [],
    );

    if (config.bgm) {
      AudioManager.playBgm(config.bgm);
    }

    this.encounterTrigger = new EncounterTrigger(this, this.player, config);

    const juice = new JuiceController(this);
    const quality = getQualitySettingsFromSave(gameStore.getState().save);
    juice.setEnabled(quality.juiceEnabled);
    this.juiceBridge = new CombatJuiceBridge(this, juice);
    this.juiceBridge.mount();

    EventBus.emit('combat:map-loaded', {
      displayNameKey: config.displayNameKey,
    });

    // Persist on either event: SHUTDOWN fires on scene.stop, but destroying
    // the whole Phaser game (SceneRouter unmount) only fires DESTROY.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.teardown());
  }

  override update(_time: number, delta: number): void {
    const targets = [this.player, ...(this.spawnManager?.getHurtboxTargets() ?? [])];
    this.hitboxManager.setTargets(targets);
    this.player.update(delta);
    this.spawnManager?.update(delta);
    this.endlessGround?.update(
      this.player.x,
      this.player.y,
      this.player.sprite.body?.velocity.x ?? 0,
      this.player.sprite.body?.velocity.y ?? 0,
    );
    this.hitboxManager.update(delta);
    this.cameraDirector?.update(this.spawnManager?.combatReadyCount ?? 0, delta);
    this.syncExitPortal();

    this.player.sprite.setDepth(this.player.sprite.y);
    if (this.spawnManager) {
      const enemies = this.spawnManager.getHurtboxTargets();
      for (const enemy of enemies) {
        enemy.sprite.setDepth(enemy.sprite.y);
      }
    }
  }

  /** Show the depart portal once waves are cleared (retreat anytime via pause / roam explore). */
  private syncExitPortal(): void {
    if (this.exitPortalRevealed || !this.exitZone) return;
    const config = getMapConfig(this.mapId);
    const exploreFree = config.spawnMode === 'roam' || config.spawnMode === 'procedural';
    const ready =
      (exploreFree && this.isRoamOrdealCleared(config)) ||
      (!exploreFree && (!this.spawnManager || this.spawnManager.isEncounterComplete()));
    if (!ready) return;
    this.exitPortalRevealed = true;
    this.exitZone.setActive(true);
    for (const visual of this.exitVisuals) {
      visual.setVisible(true);
      if ('setAlpha' in visual && typeof visual.setAlpha === 'function') {
        visual.setAlpha(1);
      }
    }
  }

  private teardown(): void {
    this.unsubscribeCombatEvents?.();
    this.unsubscribeCombatEvents = null;
    this.persistRuntime();
    this.juiceBridge?.destroy();
    this.juiceBridge = null;
    this.cameraDirector = null;
    this.encounterTrigger?.destroy();
    this.encounterTrigger = null;
    this.zonePortalManager?.destroy();
    this.zonePortalManager = null;
    this.spawnManager?.destroy();
    this.spawnManager = null;
    this.endlessGround?.destroy();
    this.endlessGround = null;
    this.worldFog?.destroy();
    this.worldFog = null;
    this.settlementDecorator?.destroy();
    this.settlementDecorator = null;
    this.hitboxManager?.destroy();
  }

  private buildStatSheet(): StatSheet {
    const save = gameStore.getState().save;
    if (!save) {
      throw new Error('MapScene: game store has no save loaded');
    }

    const modifiers = EquipmentManager.getModifiers(save.equipped);
    const sheet = new StatSheet(save.stats, modifiers);
    if (isAncientCombatActive()) {
      applyAncientGodMode(sheet);
    } else {
      sheet.setRuntime(save.runtime.hp, save.runtime.mana);
    }
    return sheet;
  }

  /** Spawn object from the Tiled "objects" layer, portal entry, else config coords. */
  private resolveSpawn(map: Phaser.Tilemaps.Tilemap, config: MapConfig): { x: number; y: number } {
    const portalSpawn = resolvePortalSpawn(config, this.spawnFromPortal);
    if (portalSpawn) return portalSpawn;

    const objects = map.getObjectLayer('objects');
    const spawnObj = objects?.objects.find((o) => o.type === 'spawn');
    if (spawnObj && typeof spawnObj.x === 'number' && typeof spawnObj.y === 'number') {
      return { x: spawnObj.x, y: spawnObj.y };
    }
    return config.spawn;
  }

  /** "encounter" marker from the Tiled objects layer, else map center. */
  private resolveEncounterCenter(
    map: Phaser.Tilemaps.Tilemap,
    config: MapConfig,
  ): { x: number; y: number } {
    const objects = map.getObjectLayer('objects');
    const marker = objects?.objects.find((o) => o.type === 'encounter');
    if (marker && typeof marker.x === 'number' && typeof marker.y === 'number') {
      return { x: marker.x, y: marker.y };
    }
    return { x: config.bounds.width / 2, y: config.bounds.height / 2 };
  }

  /** Scatter decorative environment sprites using tileset textures for 2.5D look. */
  private spawnEnvironmentDecorations(config: MapConfig): void {
    const W = config.bounds.width;
    const H = config.bounds.height;
    const margin = 160;
    const treeCount = Math.min(30, Math.floor((W * H) / 1200000) + 8);
    const rockCount = Math.floor((W * H) / 2400000) + 6;
    const lanternCount = Math.max(3, Math.floor((W * H) / 4000000));
    const bushCount = Math.floor((W * H) / 600000) + 6;
    const houseCount = Math.max(1, Math.floor((W * H) / 8000000));

    const seeded: Record<string, true> = {};
    const posKey = (x: number, y: number): string => `${Math.round(x / 80)},${Math.round(y / 80)}`;

    for (let i = 0; i < bushCount; i++) {
      const x = margin + Math.random() * (W - margin * 2);
      const y = margin + Math.random() * (H - margin * 2);
      if (seeded[posKey(x, y)]) continue;
      seeded[posKey(x, y)] = true;
      const bush = this.add.sprite(x, y, TEXTURE_KEYS.tileset, 8);
      bush.setOrigin(0.5, 1);
      bush.setScale(1.2 + Math.random() * 0.4);
      bush.setAlpha(0.85 + Math.random() * 0.15);
      bush.setDepth(y);
    }

    for (let i = 0; i < treeCount; i++) {
      const x = margin + Math.random() * (W - margin * 2);
      const y = margin + Math.random() * (H - margin * 2);
      if (seeded[posKey(x, y)]) continue;
      seeded[posKey(x, y)] = true;
      const scale = 1.0 + Math.random() * 0.5;
      const tree = this.add.sprite(x, y, STRUCTURE_TEXTURES.tree);
      tree.setOrigin(0.5, 1);
      tree.setScale(scale);
      tree.setAlpha(0.9 + Math.random() * 0.1);
      tree.setDepth(y);
    }

    for (let i = 0; i < houseCount; i++) {
      const x = margin + Math.random() * (W - margin * 2);
      const y = margin + Math.random() * (H - margin * 2);
      if (seeded[posKey(x, y)]) continue;
      seeded[posKey(x, y)] = true;
      const house = this.add.sprite(x, y, STRUCTURE_TEXTURES.house);
      house.setOrigin(0.5, 1);
      house.setScale(0.9 + Math.random() * 0.3);
      house.setDepth(y);
    }

    // Rocks (GID 14)
    for (let i = 0; i < rockCount; i++) {
      const x = margin + Math.random() * (W - margin * 2);
      const y = margin + Math.random() * (H - margin * 2);
      if (seeded[posKey(x, y)]) continue;
      seeded[posKey(x, y)] = true;
      const rock = this.add.sprite(x, y, TEXTURE_KEYS.tileset, 13);
      rock.setOrigin(0.5, 1);
      rock.setScale(0.8 + Math.random() * 0.5);
      rock.setAlpha(0.8 + Math.random() * 0.2);
      rock.setDepth(y);
    }

    // Flowers (GID 13)
    const flowerCount = bushCount;
    for (let i = 0; i < flowerCount; i++) {
      const x = margin + Math.random() * (W - margin * 2);
      const y = margin + Math.random() * (H - margin * 2);
      if (seeded[posKey(x, y)]) continue;
      seeded[posKey(x, y)] = true;
      const flower = this.add.sprite(x, y, TEXTURE_KEYS.tileset, 12);
      flower.setOrigin(0.5, 1);
      flower.setScale(0.8 + Math.random() * 0.4);
      flower.setDepth(y);
    }

    // Lanterns (GID 25)
    for (let i = 0; i < lanternCount; i++) {
      const x = 200 + Math.random() * (W - 400);
      const y = 200 + Math.random() * (H - 400);
      if (seeded[posKey(x, y)]) continue;
      seeded[posKey(x, y)] = true;
      const lantern = this.add.sprite(x, y, TEXTURE_KEYS.tileset, 24);
      lantern.setOrigin(0.5, 1);
      lantern.setScale(1.0 + Math.random() * 0.3);
      lantern.setDepth(y);
      this.tweens.add({
        targets: lantern,
        alpha: { from: 0.7, to: 1.0 },
        duration: 1200 + Math.random() * 800,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  /** Depart portal — hidden until the ordeal is cleared; use pause to retreat early. */
  private createExitZone(map: Phaser.Tilemaps.Tilemap): void {
    const objects = map.getObjectLayer('objects');
    const exitObj = objects?.objects.find((o) => o.type === 'exit');
    if (!exitObj) return;

    const x = exitObj.x ?? 0;
    const y = exitObj.y ?? 0;
    const width = exitObj.width ?? 64;
    const height = exitObj.height ?? 64;
    const label = I18nManager.t('combat.map.depart');

    const rect = this.add
      .rectangle(x + width / 2, y + height / 2, width, height, 0x8fd4c4, 0.18)
      .setStrokeStyle(2, 0x8fd4c4, 0.6)
      .setDepth(DEPTH.decoration)
      .setVisible(false)
      .setAlpha(0);
    const text = this.add
      .text(x + width / 2, y + height / 2, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#8fd4c4',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.decoration)
      .setVisible(false)
      .setAlpha(0);

    const zone = this.add.zone(x + width / 2, y + height / 2, width, height);
    this.physics.add.existing(zone, true);
    zone.setActive(false);

    this.exitZone = zone;
    this.exitVisuals = [rect, text];
    this.exitPortalRevealed = false;

    this.physics.add.overlap(this.player.sprite, zone, () => {
      if (!zone.active) return;
      const config = getMapConfig(this.mapId);
      const exploreFree = config.spawnMode === 'roam' || config.spawnMode === 'procedural';
      const wavesCleared =
        (exploreFree && this.isRoamOrdealCleared(config)) ||
        (!exploreFree &&
          (!this.spawnManager || this.spawnManager.isEncounterComplete()));
      void this.finishMapExit(wavesCleared);
    });
  }

  private subscribeCombatEvents(): void {
    const pulseCamera = (kind: 'attack' | 'skill'): void => {
      this.cameraDirector?.notifyEngagement(this.spawnManager?.combatReadyCount ?? 1, kind);
    };

    const offExit = EventBus.on('combat:request-exit', ({ wavesCleared }) => {
      if (this.exiting) return;
      void this.finishMapExit(wavesCleared);
    });
    const offSave = EventBus.on('combat:request-save', () => {
      this.persistRuntime();
      if (gameStore.getState().save) {
        void gameStore.getState().persist();
        SaveManager.scheduleAutosave();
      }
    });
    const offRetry = EventBus.on('combat:request-retry', () => {
      this.player.respawn();
    });
    const offPause = EventBus.on('combat:pause-changed', ({ paused }) => {
      if (paused) this.scene?.pause();
      else if (this.scene?.isPaused()) this.scene?.resume();
    });
    const offAttack = EventBus.on('player:attack-started', () => pulseCamera('attack'));
    const offSkill = EventBus.on('skill:cast', () => pulseCamera('skill'));
    let lastManaToastAt = 0;
    const offCastBlocked = EventBus.on('skill:cast-blocked', ({ reason }) => {
      if (reason !== 'mana') return;
      const now = performance.now();
      if (now - lastManaToastAt < 900) return;
      lastManaToastAt = now;
      this.showCombatToast(I18nManager.t('combat.skill.no_mana'));
    });
    const offMeditateStart = EventBus.on('player:meditate-started', () => {
      this.cameraDirector?.setMeditating(true);
    });
    const offMeditateEnd = EventBus.on('player:meditate-ended', () => {
      this.cameraDirector?.setMeditating(false);
    });
    const offDefeat = EventBus.on('map:cultivator-defeated', ({ isBoss, isBeast }) => {
      if (isBoss) return;
      if (isBeast) {
        this.showCombatToast(I18nManager.t('combat.beast.defeated'));
        return;
      }
      this.showCombatToast(I18nManager.t('combat.cultivator.defeated'));
    });
    const offBoss = EventBus.on('boss:defeated', ({ bossId }) => {
      const config = getMapConfig(this.mapId);
      if (config.requiredBossId === bossId) {
        this.bossOrdealCleared = true;
        this.syncExitPortal();
      }
    });
    this.unsubscribeCombatEvents = () => {
      offExit();
      offSave();
      offRetry();
      offPause();
      offAttack();
      offSkill();
      offCastBlocked();
      offMeditateStart();
      offMeditateEnd();
      offDefeat();
      offBoss();
    };
  }

  private showCombatToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'home-toast home-ui__interactive combat-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.addEventListener('animationend', () => toast.remove());
  }

  /** Roam explore maps retreat anytime; boss ordeal maps need the gate boss down. */
  private isRoamOrdealCleared(config: MapConfig): boolean {
    if (!config.requiredBossId) return true;
    if (this.bossOrdealCleared) return true;
    const save = gameStore.getState().save;
    return Boolean(save?.progress.clearedBosses.includes(config.requiredBossId));
  }

  private async finishMapExit(wavesCleared: boolean): Promise<void> {
    if (this.exiting) return;
    this.exiting = true;
    this.player.prepareForMapExit();
    this.persistRuntime();

    if (wavesCleared) {
      AudioDirector.playMapClearSting();
    }
    const save = gameStore.getState().save;
    if (isAncientCombatActive()) {
      if (isPathWalkActive() && wavesCleared) {
        await this.playPathWalkTimelineShard(this.mapId);
        void routePathWalk(onPathStepMapCleared(this.mapId));
        return;
      }
      await exitAncientDemo();
      void SceneRouter.instance.switchTo('home');
      return;
    }
    if (save) {
      const { patch, result } = applyMapClearPatch(save, this.mapId, wavesCleared);
      if (Object.keys(patch).length > 0) {
        gameStore.getState().patch(patch);
      }
      void gameStore.getState().persist();
      SaveManager.scheduleAutosave();

      if (result.pendingTimelineShard) {
        await this.offerTimelineShard(result.pendingTimelineShard);
      }

      if (result.pendingStory) {
        void SceneRouter.instance.switchTo('story', result.pendingStory);
        return;
      }
    }

    void SceneRouter.instance.switchTo('home');
  }

  /** Ancient follow-walk — auto-open this map's Dao Scroll shard between stops, skippable
   *  via the reader's own skip control (sub-plan 31 §6.3). */
  private async playPathWalkTimelineShard(mapId: string): Promise<void> {
    const shardId = getPathWalkTimelineShardId(mapId);
    if (!shardId) return;

    const store = gameStore.getState();
    if (store.save) {
      const progress = markPathWalkTimelineShardSeen(store.save, shardId);
      if (progress !== store.save.progress) {
        store.patch({ progress });
      }
    }

    const uiRoot = document.getElementById('ui-root');
    if (!uiRoot) return;

    await new Promise<void>((resolve) => {
      openTimelineShardReader(uiRoot, { shardId, onFinished: resolve });
    });
  }

  /** "A page of the road opens" — offer, then read inline before returning home (sub-plan 31 §6.2). */
  private async offerTimelineShard(shardId: string): Promise<void> {
    const uiRoot = document.getElementById('ui-root');
    if (!uiRoot) return;

    const choice = await showTimelineOfferModal(uiRoot);
    if (choice !== 'read') return;

    await new Promise<void>((resolve) => {
      openTimelineShardReader(uiRoot, { shardId, onFinished: resolve });
    });
  }

  private persistRuntime(): void {
    if (this.runtimePersisted || isAncientCombatActive()) return;
    const store = gameStore.getState();
    if (!store.save) return;
    this.runtimePersisted = true;
    const runtime = this.player.stats.runtime;
    store.patch({ runtime: { hp: runtime.hp, mana: runtime.mana } });
  }
}
