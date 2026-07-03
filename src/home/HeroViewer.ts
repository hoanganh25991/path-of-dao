import {
  BackSide,
  CapsuleGeometry,
  Color,
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
    const bob = Math.sin(this.idlePhase * 1.8) * 0.025;
    const sway = Math.sin(this.idlePhase * 0.9) * 0.04;
    this.root.position.y = HERO_STAND_Y + bob;
    this.root.rotation.y = sway;
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

  private buildProceduralHero(): void {
    const bodyMat = new MeshStandardMaterial({ color: 0x3d8b5a, roughness: 0.65 });
    const limbMat = new MeshStandardMaterial({ color: 0x2f6f47, roughness: 0.7 });
    const accentMat = new MeshStandardMaterial({
      color: 0xc9a84c,
      emissive: 0x4a3a10,
      emissiveIntensity: 0.3,
    });

    const torso = new Mesh(new CapsuleGeometry(0.28, 0.55, 4, 8), bodyMat);
    torso.position.y = 0.55;
    this.root.add(torso);

    const head = new Mesh(new CapsuleGeometry(0.16, 0.08, 4, 8), bodyMat);
    head.position.y = 1.05;
    this.root.add(head);

    const leftArm = new Mesh(new CapsuleGeometry(0.05, 0.32, 4, 6), limbMat);
    leftArm.position.set(-0.38, 0.62, 0);
    leftArm.rotation.z = 0.2;
    this.root.add(leftArm);

    const rightArm = new Mesh(new CapsuleGeometry(0.05, 0.32, 4, 6), limbMat);
    rightArm.position.set(0.38, 0.62, 0);
    rightArm.rotation.z = -0.2;
    this.root.add(rightArm);

    const leftLeg = new Mesh(new CapsuleGeometry(0.06, 0.28, 4, 6), limbMat);
    leftLeg.position.set(-0.14, 0.12, 0);
    this.root.add(leftLeg);

    const rightLeg = new Mesh(new CapsuleGeometry(0.06, 0.28, 4, 6), limbMat);
    rightLeg.position.set(0.14, 0.12, 0);
    this.root.add(rightLeg);

    const sash = new Mesh(new CapsuleGeometry(0.04, 0.12, 4, 6), accentMat);
    sash.position.y = 0.78;
    sash.rotation.z = Math.PI / 2;
    this.root.add(sash);
  }
}

export type { EquipmentSlot };
