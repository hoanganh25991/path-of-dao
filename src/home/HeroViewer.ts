import {
  BackSide,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { EquipmentAttachment } from '@/home/EquipmentAttachment';
import { EquipmentManager } from '@/progression/EquipmentManager';
import type { EquipmentSlot, EquipmentSlots } from '@/progression/ItemDefinition';

const HERO_STAND_Y = 0.74;

/**
 * Hero model for the 3D Home viewer.
 *
 * GLB assets (`assets/models/hero/wanderer.glb`) are not bundled yet — uses a
 * procedural capsule + box-limb rig with a sine idle bob.
 */
export class HeroViewer {
  readonly root = new Group();
  private idlePhase = 0;
  private petPhase = 0;
  private petMesh: Mesh | null = null;
  private equipment: EquipmentAttachment;

  // Animated rig parts (procedural cultivator).
  private torso: Mesh | null = null;
  private armL: Group | null = null;
  private armR: Group | null = null;
  private sash: Mesh | null = null;
  private cape: Mesh | null = null;
  private core: Mesh | null = null;
  private headGroup: Group | null = null;

  constructor(scene: Scene) {
    scene.add(this.root);
    this.equipment = new EquipmentAttachment(this.root);
  }

  async load(heroId: string): Promise<void> {
    void heroId;
    this.buildProceduralHero();
    this.root.position.y = HERO_STAND_Y;
  }

  setRealm(_realmId: string, _tier: string): void {
    // Aura visuals are driven by AuraController.
  }

  async syncEquipment(equipped: EquipmentSlots): Promise<void> {
    await EquipmentManager.syncHeroEquipment(equipped, async (slot, modelId) => {
      if (modelId) {
        await this.equipment.attach(slot, modelId);
      } else {
        this.equipment.detach(slot);
      }
    });
  }

  attachEquipment(slot: EquipmentSlot, itemModelId: string | null): void {
    if (itemModelId) {
      void this.equipment.attach(slot, itemModelId);
    } else {
      this.equipment.detach(slot);
    }
  }

  /** Spirit beast cosmetic — full mesh polish in sub-plan 25. */
  syncPet(petId: string | null): void {
    if (this.petMesh) {
      this.root.remove(this.petMesh);
      this.petMesh.geometry.dispose();
      (this.petMesh.material as MeshStandardMaterial).dispose();
      this.petMesh = null;
    }
    if (!petId) return;

    const mat = new MeshStandardMaterial({
      color: petId.includes('fox') ? 0xff9a4a : 0xaaddff,
      emissive: 0x331800,
      emissiveIntensity: 0.35,
    });
    this.petMesh = new Mesh(new SphereGeometry(0.1, 8, 8), mat);
    this.petMesh.position.set(0.55, 0.9, 0.2);
    this.root.add(this.petMesh);
  }

  playIdle(): void {
    this.idlePhase = 0;
  }

  update(delta: number): void {
    this.idlePhase += delta;
    this.petPhase += delta;
    const p = this.idlePhase;
    const bob = Math.sin(p * 1.8) * 0.022;
    this.root.position.y = HERO_STAND_Y + bob;
    this.root.rotation.y = Math.sin(p * 0.5) * 0.06; // slow contemplative turn

    // Secondary motion — breathing, sash sway, arm sway, glowing core pulse.
    if (this.torso) this.torso.scale.setY(1 + Math.sin(p * 2.2) * 0.02);
    if (this.headGroup) this.headGroup.rotation.x = Math.sin(p * 1.6) * 0.04;
    if (this.armL) this.armL.rotation.x = Math.sin(p * 1.7) * 0.07;
    if (this.armR) this.armR.rotation.x = -Math.sin(p * 1.7) * 0.07;
    if (this.sash) this.sash.rotation.z = Math.PI / 2 + Math.sin(p * 1.4) * 0.06;
    if (this.cape) this.cape.rotation.x = 0.14 + Math.sin(p * 1.2) * 0.06;
    if (this.core) {
      const mat = this.core.material as MeshStandardMaterial;
      mat.emissiveIntensity = 1.1 + Math.sin(p * 3) * 0.5;
      this.core.rotation.y += delta * 1.4;
    }
    this.equipment.update(delta);

    if (this.petMesh) {
      const orbit = this.petPhase * 1.4;
      this.petMesh.position.set(Math.cos(orbit) * 0.55, 0.85 + Math.sin(orbit * 2) * 0.06, Math.sin(orbit) * 0.35);
    }
  }

  dispose(): void {
    this.equipment.dispose();

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
  }

  /**
   * Stylised cultivator built from layered primitives: flared robe skirt,
   * tapered torso, back cape, gold trims, glowing dantian core. Colors match
   * PALETTE_HERO in src/combat/art/stickyManPalette.ts.
   */
  private buildProceduralHero(): void {
    const robeMat = new MeshStandardMaterial({
      color: 0xb8c4d4,
      roughness: 0.5,
      metalness: 0.05,
      emissive: 0x384858,
      emissiveIntensity: 0.25,
    });
    const robeDarkMat = new MeshStandardMaterial({ color: 0x687888, roughness: 0.6 });
    const skinMat = new MeshStandardMaterial({ color: 0xffd5a8, roughness: 0.55 });
    const eyeMat = new MeshStandardMaterial({ color: 0x0c0c14, roughness: 0.4 });
    const goldMat = new MeshStandardMaterial({
      color: 0xd4a840,
      metalness: 0.7,
      roughness: 0.28,
      emissive: 0x3a2c08,
      emissiveIntensity: 0.4,
    });
    const coreMat = new MeshStandardMaterial({
      color: 0x0a3a44,
      emissive: 0x66e0ff,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });

    // Legs (mostly hidden by the robe, read as motion under the hem).
    for (const sx of [-0.12, 0.12]) {
      const leg = new Mesh(new CylinderGeometry(0.06, 0.05, 0.36, 8), robeDarkMat);
      leg.position.set(sx, 0.14, 0);
      this.root.add(leg);
    }

    // Flared robe skirt — the signature flowing silhouette.
    const skirt = new Mesh(new CylinderGeometry(0.2, 0.44, 0.5, 14, 1, true), robeMat);
    skirt.position.y = 0.28;
    this.root.add(skirt);
    const hem = new Mesh(new TorusGeometry(0.42, 0.03, 8, 20), goldMat);
    hem.position.y = 0.05;
    hem.rotation.x = Math.PI / 2;
    this.root.add(hem);

    // Tapered torso.
    const torso = new Mesh(new CylinderGeometry(0.19, 0.26, 0.46, 12), robeMat);
    torso.position.y = 0.72;
    this.torso = torso;
    this.root.add(torso);

    // Neat V-collar + glowing dantian core.
    const lapel = new Mesh(new ConeGeometry(0.1, 0.2, 3, 1, true), robeDarkMat);
    lapel.position.set(0, 0.84, 0.14);
    lapel.rotation.x = Math.PI;
    this.root.add(lapel);
    const core = new Mesh(new SphereGeometry(0.055, 12, 12), coreMat);
    core.position.set(0, 0.66, 0.19);
    this.core = core;
    this.root.add(core);

    // Hanging front stole (two robe panels with a gold seam) for depth.
    for (const sx of [-0.07, 0.07]) {
      const panel = new Mesh(new BoxGeometry(0.06, 0.62, 0.02), robeDarkMat);
      panel.position.set(sx, 0.6, 0.17);
      this.root.add(panel);
    }
    const seam = new Mesh(new BoxGeometry(0.015, 0.6, 0.025), goldMat);
    seam.position.set(0, 0.6, 0.18);
    this.root.add(seam);

    // Waist sash (gold) — animated sway.
    const sash = new Mesh(new TorusGeometry(0.25, 0.035, 8, 20), goldMat);
    sash.position.y = 0.5;
    sash.rotation.z = Math.PI / 2;
    sash.rotation.x = Math.PI / 2;
    this.sash = sash;
    this.root.add(sash);

    // Flowing back cape (sash tails).
    const cape = new Mesh(new ConeGeometry(0.22, 0.7, 8, 1, true), robeDarkMat);
    cape.position.set(0, 0.5, -0.16);
    cape.rotation.x = 0.14;
    this.cape = cape;
    this.root.add(cape);

    // Shoulders + arms (grouped so they sway from the shoulder).
    for (const side of [-1, 1] as const) {
      const arm = new Group();
      arm.position.set(0.22 * side, 0.9, 0);

      const pad = new Mesh(new SphereGeometry(0.1, 10, 10), goldMat);
      arm.add(pad);

      const sleeve = new Mesh(new CylinderGeometry(0.07, 0.05, 0.4, 8), robeMat);
      sleeve.position.set(0.03 * side, -0.22, 0);
      sleeve.rotation.z = -0.18 * side;
      arm.add(sleeve);

      const hand = new Mesh(new SphereGeometry(0.05, 8, 8), skinMat);
      hand.position.set(0.07 * side, -0.42, 0);
      arm.add(hand);

      this.root.add(arm);
      if (side === -1) this.armL = arm;
      else this.armR = arm;
    }

    // Head group (neck, head, gold band) — subtle nod.
    const headGroup = new Group();
    headGroup.position.y = 1.02;

    const neck = new Mesh(new CylinderGeometry(0.07, 0.08, 0.1, 8), skinMat);
    neck.position.y = -0.06;
    headGroup.add(neck);

    const head = new Mesh(new SphereGeometry(0.155, 16, 16), skinMat);
    headGroup.add(head);

    for (const sx of [-0.055, 0.055]) {
      const eye = new Mesh(new SphereGeometry(0.02, 8, 8), eyeMat);
      eye.position.set(sx, 0.0, 0.14);
      headGroup.add(eye);
    }

    const headband = new Mesh(new TorusGeometry(0.155, 0.018, 8, 20), goldMat);
    headband.position.y = 0.03;
    headband.rotation.x = Math.PI / 2;
    headGroup.add(headband);

    this.headGroup = headGroup;
    this.root.add(headGroup);

    // Soft ground glow disc under the hero.
    const glow = new Mesh(
      new SphereGeometry(0.5, 16, 8),
      new MeshStandardMaterial({
        color: 0xb8c4d4,
        emissive: 0x687888,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.12,
        side: BackSide,
        depthWrite: false,
      }),
    );
    glow.scale.set(1, 0.12, 1);
    glow.position.y = 0.02;
    this.root.add(glow);
  }
}

export type { EquipmentSlot };
