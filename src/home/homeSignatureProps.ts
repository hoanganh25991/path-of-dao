import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';
import type { HomeSignatureKind } from '@/home/homeEnvironmentThemes';

const PLATFORM_Y = 0.65;

/** Small chapter-specific prop — sits on the island edge so Home is not generic. */
export function buildHomeSignature(kind: HomeSignatureKind): Group {
  const root = new Group();
  root.position.set(2.6, PLATFORM_Y + 0.1, 1.4);

  switch (kind) {
    case 'ruined_pillar':
      root.add(makeMesh(new BoxGeometry(0.22, 0.55, 0.22), 0x6a5850, { roughness: 0.95 }));
      root.add(
        makeMesh(new BoxGeometry(0.16, 0.2, 0.16), 0x5a4840, {
          roughness: 0.95,
          y: 0.38,
          z: 0.08,
          rotZ: 0.35,
        }),
      );
      break;
    case 'mist_pine':
      root.add(makeMesh(new CylinderGeometry(0.06, 0.1, 0.45, 5), 0x3a3028, { y: 0.22 }));
      root.add(makeMesh(new ConeGeometry(0.28, 0.55, 6), 0x1a5a38, { y: 0.72 }));
      root.add(
        makeMesh(new SphereGeometry(0.14, 8, 6), 0xa8d8c8, {
          transparent: true,
          opacity: 0.35,
          emissive: 0x44aa88,
          emissiveIntensity: 0.4,
          y: 1.0,
          x: 0.15,
        }),
      );
      break;
    case 'canyon_spire':
      root.add(
        makeMesh(new ConeGeometry(0.2, 0.85, 5), 0x8a5040, {
          roughness: 0.85,
          y: 0.42,
          rotZ: -0.12,
        }),
      );
      break;
    case 'moon_stone':
      root.add(makeMesh(new CylinderGeometry(0.08, 0.12, 0.25, 6), 0x485868, { y: 0.12 }));
      root.add(
        makeMesh(new SphereGeometry(0.18, 10, 8), 0xd8e8ff, {
          emissive: 0x6688cc,
          emissiveIntensity: 0.85,
          y: 0.38,
        }),
      );
      break;
    case 'desert_cactus':
      root.add(makeMesh(new CylinderGeometry(0.08, 0.1, 0.5, 6), 0x3a7040, { y: 0.25 }));
      root.add(
        makeMesh(new CylinderGeometry(0.05, 0.06, 0.22, 5), 0x3a7040, {
          y: 0.32,
          x: -0.12,
          rotZ: Math.PI / 2,
        }),
      );
      root.add(
        makeMesh(new CylinderGeometry(0.05, 0.06, 0.18, 5), 0x3a7040, {
          y: 0.42,
          x: 0.12,
          rotZ: -Math.PI / 2.5,
        }),
      );
      break;
    case 'storm_crystal':
      root.add(
        makeMesh(new ConeGeometry(0.12, 0.55, 4), 0x9988dd, {
          emissive: 0x6644cc,
          emissiveIntensity: 0.9,
          y: 0.28,
          rotY: 0.4,
        }),
      );
      root.add(
        makeMesh(new ConeGeometry(0.08, 0.35, 4), 0xbb88ff, {
          emissive: 0x8844ff,
          emissiveIntensity: 0.75,
          y: 0.2,
          x: 0.1,
          rotY: -0.6,
        }),
      );
      break;
    case 'ice_spire':
      root.add(
        makeMesh(new ConeGeometry(0.1, 0.65, 4), 0xc8e8ff, {
          emissive: 0x88bbdd,
          emissiveIntensity: 0.35,
          y: 0.32,
        }),
      );
      root.add(
        makeMesh(new ConeGeometry(0.07, 0.4, 4), 0xa8d8f0, {
          emissive: 0x66aacc,
          emissiveIntensity: 0.3,
          y: 0.22,
          x: -0.1,
          rotZ: 0.25,
        }),
      );
      break;
    case 'void_shard':
      root.add(
        makeMesh(new BoxGeometry(0.14, 0.45, 0.08), 0x180828, {
          emissive: 0xcc44aa,
          emissiveIntensity: 0.65,
          y: 0.28,
          rotY: 0.5,
          rotZ: -0.2,
        }),
      );
      break;
    case 'gate_fragment':
      root.add(makeMesh(new BoxGeometry(0.1, 0.55, 0.1), 0xccaa66, { emissive: 0x886622, emissiveIntensity: 0.35, y: 0.28, x: -0.12 }));
      root.add(makeMesh(new BoxGeometry(0.1, 0.55, 0.1), 0xccaa66, { emissive: 0x886622, emissiveIntensity: 0.35, y: 0.28, x: 0.12 }));
      root.add(makeMesh(new BoxGeometry(0.32, 0.08, 0.1), 0xeedd88, { emissive: 0xaa8844, emissiveIntensity: 0.45, y: 0.52 }));
      break;
    case 'throne_spike':
      root.add(
        makeMesh(new ConeGeometry(0.14, 0.7, 4), 0x181828, {
          emissive: 0x4422aa,
          emissiveIntensity: 0.55,
          y: 0.35,
        }),
      );
      root.add(
        makeMesh(new BoxGeometry(0.28, 0.12, 0.18), 0x282838, {
          emissive: 0x221066,
          emissiveIntensity: 0.4,
          y: 0.06,
        }),
      );
      break;
  }

  return root;
}

interface PropMeshOpts {
  roughness?: number;
  metalness?: number;
  emissive?: number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  x?: number;
  y?: number;
  z?: number;
  rotX?: number;
  rotY?: number;
  rotZ?: number;
}

function makeMesh(geometry: BoxGeometry | ConeGeometry | CylinderGeometry | SphereGeometry, color: number, opts: PropMeshOpts = {}): Mesh {
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.8,
      metalness: opts.metalness ?? 0.05,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
    }),
  );
  mesh.position.set(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  mesh.rotation.set(opts.rotX ?? 0, opts.rotY ?? 0, opts.rotZ ?? 0);
  return mesh;
}
