import type Phaser from 'phaser';
import type {
  SettlementPlacement,
  SignatureTreePlacement,
  StructurePlacement,
} from '@/combat/world/ProceduralSettlementGenerator';
import { STRUCTURE_TEXTURES } from '@/combat/art/structures/StructureRegistry';

const RUIN_TINT = 0x9a9080;
const WALL_COLOR = 0x6a6258;
const WALL_STROKE = 0x3f3a32;
const TOWER_COLOR = 0x746858;
const PAVILION_ROOF = 0x8a4030;
const PAVILION_PILLAR = 0x50432e;
const SHRINE_COLOR = 0xb08840;
const SHRINE_STROKE = 0x6a4c20;
const GATE_COLOR = 0x8a1c1c;
const WELL_RIM = 0x5a5a58;
const WELL_STROKE = 0x3a3a38;
const WELL_WATER = 0x2a5868;
const TREE_GLOW = 0xffe9a8;

/**
 * Renders settlement clusters + the signature tree as static decorative props.
 * Purely visual (no colliders) so paths through a cluster stay walkable — depth
 * is set to world Y so props sort correctly against the player/enemies each pass by.
 */
export class SettlementDecorator {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  renderSettlements(placements: SettlementPlacement[]): void {
    for (const placement of placements) {
      for (const structure of placement.structures) {
        this.spawnStructure(structure);
      }
    }
  }

  renderSignatureTree(placement: SignatureTreePlacement): void {
    const glowW = 90 * placement.scale * 0.5;
    const glowH = 34 * placement.scale * 0.5;
    const glow = this.scene.add
      .ellipse(placement.x, placement.y - 4, glowW, glowH, TREE_GLOW, 0.16)
      .setDepth(placement.y - 1);
    this.objects.push(glow);

    const tree = this.scene.add.sprite(placement.x, placement.y, STRUCTURE_TEXTURES.tree);
    tree.setOrigin(0.5, 1);
    tree.setScale(placement.scale);
    tree.setDepth(placement.y);
    this.objects.push(tree);
  }

  destroy(): void {
    for (const obj of this.objects) obj.destroy();
    this.objects.length = 0;
  }

  private spawnStructure(structure: StructurePlacement): void {
    switch (structure.kind) {
      case 'house_ruin':
      case 'house_intact':
      case 'hut':
        this.spawnHouseLike(structure);
        break;
      case 'well':
        this.spawnWell(structure);
        break;
      case 'wall_segment':
        this.spawnWallSegment(structure);
        break;
      case 'watchtower':
        this.spawnWatchtower(structure);
        break;
      case 'pavilion':
        this.spawnPavilion(structure);
        break;
      case 'shrine':
        this.spawnShrine(structure);
        break;
      case 'sect_gate':
        this.spawnSectGate(structure);
        break;
    }
  }

  private spawnHouseLike(structure: StructurePlacement): void {
    const sprite = this.scene.add.sprite(structure.x, structure.y, STRUCTURE_TEXTURES.house);
    sprite.setOrigin(0.5, 1);
    sprite.setScale(structure.kind === 'hut' ? structure.scale * 0.68 : structure.scale);
    sprite.setAngle(structure.rotationDeg * 0.2);
    sprite.setDepth(structure.y);
    if (structure.kind === 'house_ruin') {
      sprite.setTint(RUIN_TINT);
      sprite.setAlpha(0.88);
    }
    this.objects.push(sprite);
  }

  private spawnWell(structure: StructurePlacement): void {
    const rim = this.scene.add
      .ellipse(structure.x, structure.y, 26 * structure.scale, 14 * structure.scale, WELL_RIM, 1)
      .setStrokeStyle(2, WELL_STROKE)
      .setDepth(structure.y);
    const water = this.scene.add
      .ellipse(structure.x, structure.y - 1, 16 * structure.scale, 8 * structure.scale, WELL_WATER, 1)
      .setDepth(structure.y + 0.1);
    this.objects.push(rim, water);
  }

  private spawnWallSegment(structure: StructurePlacement): void {
    const wall = this.scene.add
      .rectangle(structure.x, structure.y, 56 * structure.scale, 16 * structure.scale, WALL_COLOR, 1)
      .setStrokeStyle(1, WALL_STROKE)
      .setAngle(structure.rotationDeg * 4)
      .setDepth(structure.y);
    this.objects.push(wall);
  }

  private spawnWatchtower(structure: StructurePlacement): void {
    const towerH = 60 * structure.scale;
    const tower = this.scene.add
      .rectangle(structure.x, structure.y - towerH / 2, 22 * structure.scale, towerH, TOWER_COLOR, 1)
      .setStrokeStyle(2, WALL_STROKE)
      .setDepth(structure.y);
    this.objects.push(tower);
  }

  private spawnPavilion(structure: StructurePlacement): void {
    const roof = this.scene.add
      .rectangle(structure.x, structure.y - 24 * structure.scale, 46 * structure.scale, 10 * structure.scale, PAVILION_ROOF, 0.9)
      .setDepth(structure.y);
    const pillars = this.scene.add
      .rectangle(structure.x, structure.y, 40 * structure.scale, 4 * structure.scale, PAVILION_PILLAR, 0.6)
      .setDepth(structure.y - 0.1);
    this.objects.push(roof, pillars);
  }

  private spawnShrine(structure: StructurePlacement): void {
    const base = this.scene.add
      .rectangle(structure.x, structure.y, 24 * structure.scale, 20 * structure.scale, SHRINE_COLOR, 1)
      .setStrokeStyle(2, SHRINE_STROKE)
      .setDepth(structure.y);
    this.objects.push(base);
  }

  private spawnSectGate(structure: StructurePlacement): void {
    const gap = 30 * structure.scale;
    const pillarH = 44 * structure.scale;
    const pillarA = this.scene.add
      .rectangle(structure.x - gap, structure.y - pillarH / 2, 12 * structure.scale, pillarH, GATE_COLOR, 1)
      .setDepth(structure.y);
    const pillarB = this.scene.add
      .rectangle(structure.x + gap, structure.y - pillarH / 2, 12 * structure.scale, pillarH, GATE_COLOR, 1)
      .setDepth(structure.y);
    this.objects.push(pillarA, pillarB);
  }
}
