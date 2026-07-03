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

const FOG_COLOR = 0x1a1a2e;
const PLATFORM_Y = 0.65;

export class EnvironmentBuilder {
  readonly root = new Group();
  private cloudPlane: Mesh | null = null;
  private cloudScroll = 0;

  build(scene: Scene): void {
    scene.background = new Color(0x0d1b2a);
    scene.fog = new FogExp2(FOG_COLOR, 0.035);

    this.addSkyDome(scene);
    this.addLights(scene);
    this.addIsland();
    this.addShrinePlatform();
    this.addTrees();
    this.addLanterns();
    this.addClouds();

    scene.add(this.root);
  }

  update(delta: number): void {
    if (!this.cloudPlane) return;
    this.cloudScroll = (this.cloudScroll + delta * 0.02) % 1;
    this.cloudPlane.position.x = Math.sin(this.cloudScroll * Math.PI * 2) * 4;
  }

  dispose(): void {
    this.root.traverse((node) => {
      if (node instanceof Mesh) {
        node.geometry.dispose();
        const { material } = node;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material.dispose();
        }
      }
    });
    this.root.clear();
    this.cloudPlane = null;
  }

  private addSkyDome(scene: Scene): void {
    const sky = new Mesh(
      new SphereGeometry(55, 16, 12),
      new MeshStandardMaterial({
        color: 0x1b3a5c,
        emissive: 0x0a1628,
        emissiveIntensity: 0.6,
        side: BackSide,
        fog: false,
      }),
    );
    sky.position.y = 5;
    scene.add(sky);
  }

  private addLights(scene: Scene): void {
    scene.add(new HemisphereLight(0x8ecae6, 0x1a1a2e, 0.55));

    const key = new DirectionalLight(0xfff4e0, 1.15);
    key.position.set(4, 8, 5);
    scene.add(key);

    const rim = new DirectionalLight(0x6ec6ff, 0.35);
    rim.position.set(-3, 4, -4);
    scene.add(rim);
  }

  private addIsland(): void {
    const rock = new Mesh(
      new CylinderGeometry(3.2, 3.8, 1.4, 10),
      new MeshStandardMaterial({ color: 0x3d4f3a, roughness: 0.9 }),
    );
    rock.position.y = 0.2;
    this.root.add(rock);

    const underside = new Mesh(
      new CylinderGeometry(2.4, 0.4, 2.2, 8),
      new MeshStandardMaterial({ color: 0x2a2a3a, roughness: 1 }),
    );
    underside.position.y = -1.4;
    this.root.add(underside);
  }

  private addShrinePlatform(): void {
    const platform = new Mesh(
      new CylinderGeometry(1.3, 1.5, 0.18, 10),
      new MeshStandardMaterial({ color: 0x5c4a32, roughness: 0.75, metalness: 0.1 }),
    );
    platform.position.y = PLATFORM_Y;
    this.root.add(platform);

    const ring = new Mesh(
      new CylinderGeometry(1.45, 1.45, 0.04, 12),
      new MeshStandardMaterial({
        color: 0xc9a84c,
        emissive: 0x6a5520,
        emissiveIntensity: 0.25,
        roughness: 0.5,
      }),
    );
    ring.position.y = PLATFORM_Y + 0.1;
    this.root.add(ring);
  }

  private addTrees(): void {
    const trunkGeo = new CylinderGeometry(0.08, 0.12, 0.5, 5);
    const foliageGeo = new ConeGeometry(0.35, 0.55, 6);
    const trunkMat = new MeshStandardMaterial({ color: 0x4a3728 });
    const foliageMat = new MeshStandardMaterial({ color: 0x2d5a27 });

    const tree = new Group();
    const trunk = new Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.25;
    const foliage = new Mesh(foliageGeo, foliageMat);
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
    const mat = new MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff8c00,
      emissiveIntensity: 0.9,
    });

    const spots = [
      { x: 1.6, z: 1.2 },
      { x: -1.6, z: 1.2 },
      { x: 1.6, z: -1.2 },
      { x: -1.6, z: -1.2 },
    ];

    for (const spot of spots) {
      const lantern = new Mesh(geo, mat);
      lantern.position.set(spot.x, PLATFORM_Y + 0.35, spot.z);
      this.root.add(lantern);
    }
  }

  private addClouds(): void {
    const cloud = new Mesh(
      new PlaneGeometry(18, 6),
      new MeshStandardMaterial({
        color: 0xc8d8e8,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        fog: false,
      }),
    );
    cloud.rotation.x = -Math.PI / 2;
    cloud.position.set(0, 12, -6);
    this.cloudPlane = cloud;
    this.root.add(cloud);
  }
}
