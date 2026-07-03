import {
  BackSide,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  FogExp2,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
} from 'three';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import type { HomeEnvironmentTheme } from '@/home/homeEnvironmentThemes';
import { getHomeThemeForSave } from '@/home/homeEnvironmentThemes';
import { buildHomeSignature } from '@/home/homeSignatureProps';

const PLATFORM_Y = 0.65;

interface ThemeMaterialRefs {
  sky: MeshStandardMaterial;
  rock: MeshStandardMaterial;
  underside: MeshStandardMaterial;
  platform: MeshStandardMaterial;
  ring: MeshStandardMaterial;
  trunk: MeshStandardMaterial;
  foliage: MeshStandardMaterial;
  lantern: MeshStandardMaterial;
  cloud: MeshStandardMaterial;
}

function createThemeMaterials(): ThemeMaterialRefs {
  return {
    sky: new MeshStandardMaterial({
      color: 0x1b3a5c,
      emissive: 0x0a1628,
      emissiveIntensity: 0.6,
      side: BackSide,
      fog: false,
    }),
    rock: new MeshStandardMaterial({ color: 0x3d4f3a, roughness: 0.9 }),
    underside: new MeshStandardMaterial({ color: 0x2a2a3a, roughness: 1 }),
    platform: new MeshStandardMaterial({ color: 0x5c4a32, roughness: 0.75, metalness: 0.1 }),
    ring: new MeshStandardMaterial({
      color: 0xc9a84c,
      emissive: 0x6a5520,
      emissiveIntensity: 0.25,
      roughness: 0.5,
    }),
    trunk: new MeshStandardMaterial({ color: 0x4a3728 }),
    foliage: new MeshStandardMaterial({ color: 0x2d5a27 }),
    lantern: new MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff8c00,
      emissiveIntensity: 0.9,
    }),
    cloud: new MeshStandardMaterial({
      color: 0xc8d8e8,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      fog: false,
    }),
  };
}

export class EnvironmentBuilder {
  readonly root = new Group();
  private scene: Scene | null = null;
  private hemiLight: HemisphereLight | null = null;
  private keyLight: DirectionalLight | null = null;
  private rimLight: DirectionalLight | null = null;
  private materials: ThemeMaterialRefs | null = null;
  private signatureRoot: Group | null = null;
  private cloudPlane: Mesh | null = null;
  private cloudScroll = 0;
  private pulse = 0;
  private activeThemeId = '';

  build(scene: Scene, save: PlayerSaveV1): void {
    this.scene = scene;
    this.materials = createThemeMaterials();

    scene.fog = new FogExp2(0x1a1a2e, 0.035);
    scene.background = new Color(0x0d1b2a);

    this.addSkyDome(scene);
    this.addLights(scene);
    this.addIsland();
    this.addShrinePlatform();
    this.addTrees();
    this.addLanterns();
    this.addClouds();
    scene.add(this.root);
    this.applyTheme(getHomeThemeForSave(save));
  }

  applyTheme(theme: HomeEnvironmentTheme): void {
    if (!this.scene || !this.materials) return;
    if (this.activeThemeId === theme.chapterId) return;
    this.activeThemeId = theme.chapterId;

    this.scene.background = new Color(theme.background);
    if (this.scene.fog instanceof FogExp2) {
      this.scene.fog.color.setHex(theme.fogColor);
      this.scene.fog.density = theme.fogDensity;
    }

    const m = this.materials;
    m.sky.color.setHex(theme.sky.color);
    m.sky.emissive.setHex(theme.sky.emissive);
    m.sky.emissiveIntensity = theme.sky.emissiveIntensity;

    this.hemiLight?.color.setHex(theme.lights.hemiSky);
    this.hemiLight?.groundColor.setHex(theme.lights.hemiGround);
    if (this.hemiLight) this.hemiLight.intensity = theme.lights.hemiIntensity;

    this.keyLight?.color.setHex(theme.lights.key);
    if (this.keyLight) this.keyLight.intensity = theme.lights.keyIntensity;

    this.rimLight?.color.setHex(theme.lights.rim);
    if (this.rimLight) this.rimLight.intensity = theme.lights.rimIntensity;

    m.rock.color.setHex(theme.island.rock);
    m.underside.color.setHex(theme.island.underside);
    m.platform.color.setHex(theme.island.platform);
    m.ring.color.setHex(theme.island.ring);
    m.ring.emissive.setHex(theme.island.ringEmissive);

    m.trunk.color.setHex(theme.foliage.trunk);
    m.foliage.color.setHex(theme.foliage.leaf);

    m.lantern.color.setHex(theme.lantern.color);
    m.lantern.emissive.setHex(theme.lantern.emissive);
    m.lantern.emissiveIntensity = theme.lantern.emissiveIntensity;

    m.cloud.color.setHex(theme.cloud.color);
    m.cloud.opacity = theme.cloud.opacity;

    this.swapSignature(theme.signature);
  }

  syncFromSave(save: PlayerSaveV1): void {
    this.applyTheme(getHomeThemeForSave(save));
  }

  update(delta: number): void {
    this.pulse += delta;
    if (this.cloudPlane) {
      this.cloudScroll = (this.cloudScroll + delta * 0.02) % 1;
      this.cloudPlane.position.x = Math.sin(this.cloudScroll * Math.PI * 2) * 4;
    }
    if (this.signatureRoot) {
      this.signatureRoot.position.y = PLATFORM_Y + 0.1 + Math.sin(this.pulse * 1.4) * 0.03;
      this.signatureRoot.rotation.y = Math.sin(this.pulse * 0.35) * 0.08;
    }
  }

  dispose(): void {
    this.disposeGroup(this.signatureRoot);
    this.signatureRoot = null;
    this.root.traverse((node) => {
      if (node instanceof Mesh) {
        node.geometry.dispose();
      }
    });
    this.root.clear();
    if (this.materials) {
      Object.values(this.materials).forEach((mat) => mat.dispose());
    }
    this.materials = null;
    this.cloudPlane = null;
    this.scene = null;
    this.activeThemeId = '';
  }

  private swapSignature(kind: HomeEnvironmentTheme['signature']): void {
    if (this.signatureRoot) {
      this.disposeGroup(this.signatureRoot);
      this.root.remove(this.signatureRoot);
    }
    this.signatureRoot = buildHomeSignature(kind);
    this.root.add(this.signatureRoot);
  }

  private disposeGroup(group: Group | null): void {
    if (!group) return;
    group.traverse((node) => {
      if (node instanceof Mesh) {
        node.geometry.dispose();
        const { material } = node;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else if (material !== this.materials?.lantern) {
          material.dispose();
        }
      }
    });
  }

  private addSkyDome(scene: Scene): void {
    const sky = new Mesh(new SphereGeometry(55, 16, 12), this.materials!.sky);
    sky.position.y = 5;
    scene.add(sky);
  }

  private addLights(scene: Scene): void {
    const hemi = new HemisphereLight(0x8ecae6, 0x1a1a2e, 0.55);
    scene.add(hemi);
    this.hemiLight = hemi;

    const key = new DirectionalLight(0xfff4e0, 1.15);
    key.position.set(4, 8, 5);
    scene.add(key);
    this.keyLight = key;

    const rim = new DirectionalLight(0x6ec6ff, 0.35);
    rim.position.set(-3, 4, -4);
    scene.add(rim);
    this.rimLight = rim;
  }

  private addIsland(): void {
    const rock = new Mesh(new CylinderGeometry(3.2, 3.8, 1.4, 10), this.materials!.rock);
    rock.position.y = 0.2;
    this.root.add(rock);

    const underside = new Mesh(new CylinderGeometry(2.4, 0.4, 2.2, 8), this.materials!.underside);
    underside.position.y = -1.4;
    this.root.add(underside);
  }

  private addShrinePlatform(): void {
    const platform = new Mesh(new CylinderGeometry(1.3, 1.5, 0.18, 10), this.materials!.platform);
    platform.position.y = PLATFORM_Y;
    this.root.add(platform);

    const ring = new Mesh(new CylinderGeometry(1.45, 1.45, 0.04, 12), this.materials!.ring);
    ring.position.y = PLATFORM_Y + 0.1;
    this.root.add(ring);
  }

  private addTrees(): void {
    const trunkGeo = new CylinderGeometry(0.08, 0.12, 0.5, 5);
    const foliageGeo = new ConeGeometry(0.35, 0.55, 6);
    const tree = new Group();
    const trunk = new Mesh(trunkGeo, this.materials!.trunk);
    trunk.position.y = 0.25;
    const foliage = new Mesh(foliageGeo, this.materials!.foliage);
    foliage.position.y = 0.75;
    tree.add(trunk, foliage);

    const positions = [
      { x: -2.2, z: -1.4, scale: 0.9 },
      { x: 2.4, z: -0.8, scale: 1.1 },
      { x: -1.6, z: 2.0, scale: 0.85 },
    ];

    for (const pos of positions) {
      const instance = tree.clone();
      instance.position.set(pos.x, PLATFORM_Y + 0.1, pos.z);
      instance.scale.setScalar(pos.scale);
      this.root.add(instance);
    }
  }

  private addLanterns(): void {
    const geo = new BoxGeometry(0.12, 0.2, 0.12);
    const spots = [
      { x: 1.6, z: 1.2 },
      { x: -1.6, z: 1.2 },
      { x: 1.6, z: -1.2 },
      { x: -1.6, z: -1.2 },
    ];

    for (const spot of spots) {
      const lantern = new Mesh(geo, this.materials!.lantern);
      lantern.position.set(spot.x, PLATFORM_Y + 0.35, spot.z);
      this.root.add(lantern);
    }
  }

  private addClouds(): void {
    const cloud = new Mesh(new PlaneGeometry(18, 6), this.materials!.cloud);
    cloud.rotation.x = -Math.PI / 2;
    cloud.position.set(0, 12, -6);
    this.cloudPlane = cloud;
    this.root.add(cloud);
  }
}
