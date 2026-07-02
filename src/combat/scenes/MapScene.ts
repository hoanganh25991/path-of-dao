import Phaser from 'phaser';
import { SceneRouter } from '@/app/SceneRouter';
import { gameStore } from '@/core/store/gameStore';
import { StatSheet } from '@/progression/StatSheet';
import { getMapConfig } from '@/combat/map/MapLoader';
import type { MapConfig } from '@/combat/map/MapConfig';
import { CollisionLayer } from '@/combat/map/CollisionLayer';
import { Player } from '@/combat/entities/Player';
import { tilemapKey } from '@/combat/scenes/BootScene';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';

const CAMERA_LERP = 0.08;
const CAMERA_DEADZONE = 80;

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
  private player!: Player;
  private exiting = false;

  constructor() {
    super(MapScene.KEY);
  }

  init(data: { mapId: string }): void {
    this.mapId = data.mapId;
  }

  create(): void {
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
    this.player = new Player(this, spawn.x, spawn.y, this.buildStatSheet());
    this.physics.add.collider(this.player.sprite, collision);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, config.bounds.width, config.bounds.height);
    camera.startFollow(this.player.sprite, true, CAMERA_LERP, CAMERA_LERP);
    camera.setDeadzone(CAMERA_DEADZONE, CAMERA_DEADZONE);

    this.createExitZone(map);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.persistRuntime();
      this.player.destroy();
    });
  }

  override update(_time: number, delta: number): void {
    this.player.update(delta);
  }

  private buildStatSheet(): StatSheet {
    const save = gameStore.getState().save;
    if (!save) {
      throw new Error('MapScene: game store has no save loaded');
    }

    const sheet = new StatSheet(save.stats);
    sheet.setRuntime(save.runtime.hp, save.runtime.mana);
    return sheet;
  }

  /** Spawn object from the Tiled "objects" layer, else config coords. */
  private resolveSpawn(map: Phaser.Tilemaps.Tilemap, config: MapConfig): { x: number; y: number } {
    const objects = map.getObjectLayer('objects');
    const spawnObj = objects?.objects.find((o) => o.type === 'spawn');
    if (spawnObj && typeof spawnObj.x === 'number' && typeof spawnObj.y === 'number') {
      return { x: spawnObj.x, y: spawnObj.y };
    }
    return config.spawn;
  }

  /** Temporary dev exit (06 §6.2): walk into the marked zone → back to Home. */
  private createExitZone(map: Phaser.Tilemaps.Tilemap): void {
    const objects = map.getObjectLayer('objects');
    const exitObj = objects?.objects.find((o) => o.type === 'exit');
    if (!exitObj) return;

    const x = exitObj.x ?? 0;
    const y = exitObj.y ?? 0;
    const width = exitObj.width ?? 64;
    const height = exitObj.height ?? 64;

    this.add
      .rectangle(x + width / 2, y + height / 2, width, height, 0x8fd4c4, 0.18)
      .setStrokeStyle(2, 0x8fd4c4, 0.6)
      .setDepth(DEPTH.decoration);
    this.add
      .text(x + width / 2, y + height / 2, 'EXIT', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#8fd4c4',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.decoration);

    const zone = this.add.zone(x + width / 2, y + height / 2, width, height);
    this.physics.add.existing(zone, true);

    this.physics.add.overlap(this.player.sprite, zone, () => {
      if (this.exiting) return;
      this.exiting = true;
      void SceneRouter.instance.switchTo('home');
    });
  }

  private persistRuntime(): void {
    const store = gameStore.getState();
    if (!store.save) return;
    const runtime = this.player.stats.runtime;
    store.patch({ runtime: { hp: runtime.hp, mana: runtime.mana } });
  }
}
