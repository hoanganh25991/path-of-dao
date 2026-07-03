import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  Scene,
  TorusGeometry,
} from 'three';
import type { AuraTier } from '@/home/realmAura';

const ANCHOR_Y = 0.55;

export class AuraController {
  readonly root = new Group();
  private tier: AuraTier = 'none';
  private points: Points | null = null;
  private ring: Mesh | null = null;
  private voidRing: Mesh | null = null;
  private phase = 0;

  constructor(scene: Scene) {
    scene.add(this.root);
    this.root.position.y = ANCHOR_Y;
  }

  setTier(tier: AuraTier): void {
    if (tier === this.tier) return;
    this.clearEffects();
    this.tier = tier;

    switch (tier) {
      case 'none':
        break;
      case 'faint':
        this.points = this.createRisingPoints(18, 0x88ccff, 0.35, 0.8, 1.4);
        break;
      case 'swirling':
        this.points = this.createOrbitingPoints(30, 0xaaddff, 0.55, 0.9);
        this.ring = this.createRing(0.55, 0x88bbee, 0.25);
        break;
      case 'void':
        this.points = this.createOrbitingPoints(24, 0xbb66ff, 0.65, 1.1);
        this.voidRing = this.createVoidRing();
        break;
      case 'true_dao':
        this.points = this.createOrbitingPoints(36, 0xffd966, 0.75, 1.2);
        this.ring = this.createRing(0.65, 0xffcc44, 0.45);
        break;
    }
  }

  update(delta: number): void {
    if (this.tier === 'none') return;

    this.phase += delta;
    const positions = this.points?.geometry.getAttribute('position') as BufferAttribute | undefined;
    if (!positions) return;

    const count = positions.count;
    for (let i = 0; i < count; i += 1) {
      const angle = this.phase * (this.tier === 'faint' ? 0.4 : 1.2) + (i / count) * Math.PI * 2;
      const radius =
        this.tier === 'faint' ? 0.25 + (i % 5) * 0.04 : 0.45 + (i % 7) * 0.03;
      const y =
        this.tier === 'faint'
          ? ((this.phase * 0.5 + i * 0.12) % 1.6) - 0.2
          : Math.sin(angle * 2 + this.phase) * 0.25 + 0.35;

      positions.setXYZ(
        i,
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius,
      );
    }
    positions.needsUpdate = true;

    if (this.ring) {
      this.ring.rotation.z += delta * 0.6;
      this.ring.rotation.x = Math.sin(this.phase * 0.8) * 0.15;
    }
    if (this.voidRing) {
      this.voidRing.rotation.z -= delta * 0.9;
      this.voidRing.rotation.y = Math.sin(this.phase) * 0.2;
    }
  }

  dispose(): void {
    this.clearEffects();
    this.root.clear();
  }

  private clearEffects(): void {
    for (const child of [...this.root.children]) {
      if (child instanceof Points || child instanceof Mesh) {
        child.geometry.dispose();
        const { material } = child;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material.dispose();
        }
      }
      this.root.remove(child);
    }
    this.points = null;
    this.ring = null;
    this.voidRing = null;
  }

  private createRisingPoints(
    count: number,
    color: number,
    size: number,
    _speed: number,
    _height: number,
  ): Points {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    geometry.setAttribute('position', new BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color: new Color(color),
      size: 0.06 * size,
      transparent: true,
      opacity: 0.75,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new Points(geometry, material);
    points.scale.setScalar(size);
    this.root.add(points);
    return points;
  }

  private createOrbitingPoints(count: number, color: number, size: number, _radius: number): Points {
    return this.createRisingPoints(count, color, size, 1, 1);
  }

  private createRing(radius: number, color: number, opacity: number): Mesh {
    const ring = new Mesh(
      new TorusGeometry(radius, 0.02, 8, 32),
      new MeshBasicMaterial({
        color: new Color(color),
        transparent: true,
        opacity,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    this.root.add(ring);
    return ring;
  }

  /** Shader-lite void distortion stub — emissive torus with pulsing opacity. */
  private createVoidRing(): Mesh {
    const ring = new Mesh(
      new TorusGeometry(0.7, 0.035, 8, 40),
      new MeshBasicMaterial({
        color: 0x9933ff,
        transparent: true,
        opacity: 0.5,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.rotation.x = Math.PI / 2.2;
    this.root.add(ring);
    return ring;
  }
}
