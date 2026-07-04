import Phaser from 'phaser';
import { SceneRouter } from '@/app/SceneRouter';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { SaveManager } from '@/core/save/SaveManager';
import { applyMapClearPatch } from '@/progression/ChapterManager';
import { I18nManager } from '@/core/i18n/I18nManager';
import { exitAncientDemo, getActiveAncientId, getAncientProfile } from '@/progression/AncientDemoManager';
import { applyAncientGodMode, isAncientCombatActive } from '@/progression/AncientCombatMode';
import { isPathWalkActive, onPathStepMapCleared, routePathWalk } from '@/progression/PathWalkManager';
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
import { ZonePortalManager } from '@/combat/systems/ZonePortalManager';
import { resolvePortalSpawn } from '@/combat/map/portalSpawn';
import { getRoamConfig } from '@/combat/map/RoamLoader';
import { AudioManager } from '@/core/audio/AudioManager';
import { EncounterTrigger } from '@/combat/systems/EncounterTrigger';
import { HitboxManager } from '@/combat/combat/HitboxManager';
import { tilemapKey } from '@/combat/scenes/BootScene';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import { getQualitySettingsFromSave } from '@/app/QualityProfile';
import { CombatJuiceBridge } from '@/combat/juice/CombatJuiceBridge';
import { JuiceController } from '@/combat/juice/JuiceController';
import { CombatCameraDirector } from '@/combat/camera/CombatCameraDirector';

const CAMERA_LERP = 0.08;
const CAMERA_DEADZONE = 100;
/** Zoom tuned for crisp 32×56 sticky-man @ 2× scale — avoid tiny muddy sprites. */
const COMBAT_ZOOM = 0.88;
const ANCIENT_COMBAT_ZOOM = 0.72;

const DEPTH = {
  ground: 0,
  decoration: 1,
  player: 10,
  foreground: 20,
} as const;

/** Main gameplay scene: tilemap, collision, player, camera, dev exit. */
export class MapScene extends Phaser.Scene {
  static readonly KEY = 'MapScene';

  private mapId = '';
  private spawnFromPortal?: string;
  private player!: Player;
  private hitboxManager!: HitboxManager;
  private spawnManager: SpawnManager | RoamingSpawnManager | null = null;
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

    this.physics.world.setBounds(0, 0, config.bounds.width, config.bounds.height);

    const spawn = this.resolveSpawn(map, config);
    this.hitboxManager = new HitboxManager(this);
    const save = gameStore.getState().save;
    const attackStyle = save ? resolveAttackStyle(save) : 'unarmed';
    registerHeroCombatAssets(this, attackStyle);
    this.player = new Player(this, spawn.x, spawn.y, this.buildStatSheet(), this.hitboxManager);
    this.player.attackerRealmOrder = save ? getRealmOrder(save.realm.id) : 1;
    this.player.mapRecommendedRealmOrder = config.recommendedRealmOrder;
    if (save) {
      this.player.attackStyle = attackStyle;
    }
    this.physics.add.collider(this.player.sprite, collision);

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
    camera.setBounds(0, 0, config.bounds.width, config.bounds.height);
    const baseZoom = isAncientCombatActive() ? ANCIENT_COMBAT_ZOOM : COMBAT_ZOOM;
    camera.setZoom(baseZoom);
    camera.startFollow(this.player.sprite, true, CAMERA_LERP, CAMERA_LERP);
    camera.setDeadzone(CAMERA_DEADZONE, CAMERA_DEADZONE);
    this.cameraDirector = new CombatCameraDirector(camera, baseZoom);

    this.createExitZone(map);
    this.subscribeCombatEvents();

    if (config.portals.length > 0) {
      this.zonePortalManager = new ZonePortalManager(this, this.player, map, config, () => {
        this.persistRuntime();
      });
    }

    if (config.spawnMode === 'roam' && config.roamTable) {
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
    } else if (config.encounterTable) {
      this.spawnManager = new SpawnManager(
        this,
        this.player,
        config.encounterTable,
        this.resolveEncounterCenter(map, config),
        collision,
        this.hitboxManager,
      );
      this.spawnManager.start();
    }

    if (config.bgm) {
      AudioManager.playBgm(config.bgm);
    }

    this.encounterTrigger = new EncounterTrigger(this, this.player, config);

    const juice = new JuiceController(this);
    const quality = getQualitySettingsFromSave(gameStore.getState().save);
    juice.setEnabled(quality.juiceEnabled);
    this.juiceBridge = new CombatJuiceBridge(this, juice);
    this.juiceBridge.mount();

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
    this.hitboxManager.update(delta);
    this.cameraDirector?.update(this.spawnManager?.combatReadyCount ?? 0, delta);
    this.syncExitPortal();
  }

  /** Show the depart portal once waves are cleared (retreat anytime via pause / roam maps). */
  private syncExitPortal(): void {
    if (this.exitPortalRevealed || !this.exitZone) return;
    const config = getMapConfig(this.mapId);
    const roamExplore = config.spawnMode === 'roam';
    const ready = roamExplore || !this.spawnManager || this.spawnManager.isEncounterComplete();
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
      const roamExplore = config.spawnMode === 'roam';
      const wavesCleared =
        roamExplore ||
        !this.spawnManager ||
        this.spawnManager.isEncounterComplete();
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
    const offDefeat = EventBus.on('map:cultivator-defeated', ({ isBoss }) => {
      if (isBoss) return;
      this.showCombatToast(I18nManager.t('combat.cultivator.defeated'));
    });
    this.unsubscribeCombatEvents = () => {
      offExit();
      offSave();
      offRetry();
      offPause();
      offAttack();
      offSkill();
      offDefeat();
    };
  }

  private showCombatToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'home-toast home-ui__interactive combat-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.addEventListener('animationend', () => toast.remove());
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
      if (result.pendingStory) {
        void SceneRouter.instance.switchTo('story', result.pendingStory);
        return;
      }
    }

    void SceneRouter.instance.switchTo('home');
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
