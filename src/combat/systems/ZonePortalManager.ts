import Phaser from 'phaser';
import { I18nManager } from '@/core/i18n/I18nManager';
import type { MapConfig } from '@/combat/map/MapConfig';
import type { Player } from '@/combat/entities/Player';
import { BootScene } from '@/combat/scenes/BootScene';

const PORTAL_DEPTH = 7;
const PORTAL_COOLDOWN_MS = 900;

interface PortalVisual {
  zone: Phaser.GameObjects.Zone;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  config: MapConfig['portals'][number];
  coolingDown: boolean;
}

/** Door triggers between sub-zones on the same Tu Chân Tinh. */
export class ZonePortalManager {
  private readonly portals: PortalVisual[] = [];
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    map: Phaser.Tilemaps.Tilemap,
    config: MapConfig,
    private readonly onTransition: () => void,
  ) {
    const tiledPortals = map.getObjectLayer('objects')?.objects.filter((o) => o.type === 'portal') ?? [];

    for (const portal of config.portals) {
      const tiled = tiledPortals.find((o) => o.name === portal.id);
      const x = tiled?.x ?? portal.x ?? 0;
      const y = tiled?.y ?? portal.y ?? 0;
      const width = tiled?.width ?? portal.width;
      const height = tiled?.height ?? portal.height;

      const rect = scene.add
        .rectangle(x + width / 2, y + height / 2, width, height, 0xc4a574, 0.22)
        .setStrokeStyle(2, 0xe8d5a8, 0.55)
        .setDepth(PORTAL_DEPTH);

      const label = scene.add
        .text(x + width / 2, y + height / 2 - 8, I18nManager.t('combat.map.portal'), {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#e8d5a8',
        })
        .setOrigin(0.5)
        .setDepth(PORTAL_DEPTH + 1);

      const zone = scene.add.zone(x + width / 2, y + height / 2, width, height);
      scene.physics.add.existing(zone, true);

      const visual: PortalVisual = { zone, rect, label, config: portal, coolingDown: false };
      this.portals.push(visual);

      scene.physics.add.overlap(player.sprite, zone, () => {
        if (visual.coolingDown || this.destroyed) return;
        visual.coolingDown = true;
        this.onTransition();
        scene.time.delayedCall(PORTAL_COOLDOWN_MS, () => {
          visual.coolingDown = false;
        });
        scene.scene.start(BootScene.KEY, {
          mapId: portal.targetMapId,
          spawnFromPortal: portal.targetPortalId,
        });
      });
    }
  }

  destroy(): void {
    this.destroyed = true;
    for (const portal of this.portals) {
      portal.zone.destroy();
      portal.rect.destroy();
      portal.label.destroy();
    }
    this.portals.length = 0;
  }
}
