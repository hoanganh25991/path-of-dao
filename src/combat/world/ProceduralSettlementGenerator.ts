import type {
  ProceduralWorldConfig,
  SettlementConfig,
  SettlementStructureType,
  SettlementType,
  SignatureTreeConfig,
} from '@/combat/world/ProceduralWorldConfig';
import { mixSeed, seededFloat, seededInt } from '@/combat/world/seededRandom';

const SETTLEMENT_SALT_BASE = 51_000;
const SETTLEMENT_SALT_STRIDE = 97;
const TREE_SALT = 52_000;

export interface StructurePlacement {
  kind: SettlementStructureType;
  x: number;
  y: number;
  scale: number;
  rotationDeg: number;
}

export interface SettlementPlacement {
  id: string;
  type: SettlementType;
  center: { x: number; y: number };
  radius: number;
  structures: StructurePlacement[];
}

export interface SignatureTreePlacement {
  propId: string;
  displayNameKey?: string;
  x: number;
  y: number;
  scale: number;
}

/** Used whenever a profile declares no `settlements[]` — every procedural map still reads as lived-in. */
const DEFAULT_SETTLEMENT: SettlementConfig = {
  type: 'hamlet',
  structures: ['hut', 'house_ruin', 'well'],
  radius: 220,
  minDistCells: 1,
  maxDistCells: 3,
};

/** Used whenever a profile declares no `signatureTree` — every procedural map still gets a landmark. */
const DEFAULT_TREE: SignatureTreeConfig = {
  propId: 'prop.tree.signature',
  scale: 2.6,
  minDistCells: 2,
  maxDistCells: 5,
};

/** Deterministic angle + distance band anchor — same seed/salt always resolves to the same point. */
function anchorFromSeed(
  worldSeed: number,
  salt: number,
  cellSize: number,
  minDistCells: number,
  maxDistCells: number,
): { x: number; y: number } {
  const seed = mixSeed(worldSeed, salt);
  const angle = seededFloat(seed, 1) * Math.PI * 2;
  const span = Math.max(0, maxDistCells - minDistCells);
  const distCells = minDistCells + seededFloat(seed, 2) * span;
  const dist = distCells * cellSize;
  return { x: Math.round(Math.cos(angle) * dist), y: Math.round(Math.sin(angle) * dist) };
}

function resolveAnchor(
  worldSeed: number,
  salt: number,
  cellSize: number,
  anchorCell: { x: number; y: number } | undefined,
  minDistCells: number,
  maxDistCells: number,
): { x: number; y: number } {
  if (anchorCell) {
    return { x: anchorCell.x * cellSize, y: anchorCell.y * cellSize };
  }
  return anchorFromSeed(worldSeed, salt, cellSize, minDistCells, maxDistCells);
}

function layoutSettlement(
  worldSeed: number,
  index: number,
  config: SettlementConfig,
  cellSize: number,
  originX: number,
  originY: number,
): SettlementPlacement {
  const salt = SETTLEMENT_SALT_BASE + index * SETTLEMENT_SALT_STRIDE;
  const anchor = resolveAnchor(worldSeed, salt, cellSize, config.anchorCell, config.minDistCells, config.maxDistCells);
  const centerX = originX + anchor.x;
  const centerY = originY + anchor.y;
  const clusterSeed = mixSeed(worldSeed, salt);

  const structures: StructurePlacement[] = config.structures.map((kind, i) => {
    const structSeed = mixSeed(clusterSeed, 700 + i * 13);
    const angle = (i / config.structures.length) * Math.PI * 2 + seededFloat(structSeed, 1) * 0.6;
    const r = config.radius * (0.3 + seededFloat(structSeed, 2) * 0.7);
    return {
      kind,
      x: centerX + Math.round(Math.cos(angle) * r),
      y: centerY + Math.round(Math.sin(angle) * r),
      scale: 0.9 + seededFloat(structSeed, 3) * 0.35,
      rotationDeg: seededInt(structSeed, 4, -4, 4),
    };
  });

  return {
    id: config.id ?? `settlement.auto.${index}`,
    type: config.type,
    center: { x: centerX, y: centerY },
    radius: config.radius,
    structures,
  };
}

/**
 * ≥1 deterministic settlement cluster per procedural map — profile-declared `settlements[]`,
 * or one seeded default hamlet when the profile omits it. Same worldSeed + profile + origin
 * always yields identical positions (revisit-stable, no collision — leaves paths walkable).
 */
export function generateSettlementPlacements(
  worldSeed: number,
  profile: ProceduralWorldConfig,
  originX: number,
  originY: number,
): SettlementPlacement[] {
  const configs = profile.settlements.length > 0 ? profile.settlements : [DEFAULT_SETTLEMENT];
  return configs.map((config, index) =>
    layoutSettlement(worldSeed, index, config, profile.cellSize, originX, originY),
  );
}

/**
 * Exactly one signature landmark tree per procedural map — profile-declared `signatureTree`,
 * or a seeded default. Deterministic like `generateSettlementPlacements`.
 */
export function generateSignatureTreePlacement(
  worldSeed: number,
  profile: ProceduralWorldConfig,
  originX: number,
  originY: number,
): SignatureTreePlacement {
  const config = profile.signatureTree ?? DEFAULT_TREE;
  const anchor = resolveAnchor(
    worldSeed,
    TREE_SALT,
    profile.cellSize,
    config.anchorCell,
    config.minDistCells,
    config.maxDistCells,
  );

  return {
    propId: config.propId,
    displayNameKey: config.displayNameKey,
    x: originX + anchor.x,
    y: originY + anchor.y,
    scale: config.scale,
  };
}
