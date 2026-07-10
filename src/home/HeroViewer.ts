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
import { homeScreenPixelsToWorldY, HOME_PLATFORM_TOP_Y } from '@/home/CameraRig';
import { EquipmentManager } from '@/progression/EquipmentManager';
import type { EquipmentSlot, EquipmentSlots } from '@/progression/ItemDefinition';

/** Extra lift so boots clear the visible ground. */
const HERO_GROUND_CLEARANCE_PX = 40;

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
  private standY = HOME_PLATFORM_TOP_Y;

  constructor(scene: Scene) {
    scene.add(this.root);
    this.equipment = new EquipmentAttachment(this.root);
  }

  async load(heroId: string): Promise<void> {
    void heroId;
    this.buildProceduralHero();
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas-3d');
    const viewportHeight = canvas?.clientHeight ?? window.innerHeight;
    const liftY = homeScreenPixelsToWorldY(HERO_GROUND_CLEARANCE_PX, viewportHeight);
    this.standY = HOME_PLATFORM_TOP_Y + liftY;
    this.root.position.y = this.standY;
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
    this.root.position.y = this.standY + bob;
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

  /** Low-poly open palm + spread fingers; origin sits at the wrist joint. */
  private buildHand(side: -1 | 1, skinMat: MeshStandardMaterial): Group {
    const hand = new Group();
    const knuckle = new Mesh(new SphereGeometry(0.024, 6, 6), skinMat);
    knuckle.scale.set(1.1, 0.75, 0.9);
    hand.add(knuckle);

    const palm = new Mesh(new BoxGeometry(0.06, 0.065, 0.022), skinMat);
    palm.position.set(0, -0.034, 0.012);
    palm.rotation.x = 0.18;
    hand.add(palm);

    for (let i = 0; i < 4; i++) {
      const finger = new Mesh(new BoxGeometry(0.011, 0.04, 0.016), skinMat);
      const spread = (i - 1.5) * 0.013;
      finger.position.set(spread * side, -0.074, 0.014 + Math.abs(spread) * 0.2);
      finger.rotation.x = 0.12;
      finger.rotation.z = spread * 0.55 * side;
      hand.add(finger);
    }

    const thumb = new Mesh(new BoxGeometry(0.013, 0.032, 0.016), skinMat);
    thumb.position.set(0.038 * side, -0.048, 0.022);
    thumb.rotation.z = -0.65 * side;
    thumb.rotation.x = 0.2;
    hand.add(thumb);

    return hand;
  }

  /** Low-poly boot: sole + toe box + ankle cuff; origin at the ground contact. */
  private buildFoot(side: -1 | 1, bootMat: MeshStandardMaterial): Group {
    const foot = new Group();

    const sole = new Mesh(new BoxGeometry(0.1, 0.028, 0.18), bootMat);
    sole.position.set(0.008 * side, 0.014, 0.03);
    foot.add(sole);

    const toe = new Mesh(new BoxGeometry(0.092, 0.04, 0.07), bootMat);
    toe.position.set(0.008 * side, 0.032, 0.085);
    toe.rotation.x = -0.08;
    foot.add(toe);

    const vamp = new Mesh(new BoxGeometry(0.088, 0.055, 0.09), bootMat);
    vamp.position.set(0.006 * side, 0.045, 0.01);
    foot.add(vamp);

    const ankle = new Mesh(new CylinderGeometry(0.042, 0.048, 0.06, 8), bootMat);
    ankle.position.set(0, 0.07, -0.02);
    foot.add(ankle);

    return foot;
  }

  /** Tapered limb from the group origin — down for arms, up for legs. */
  private buildLimbSegment(
    topRadius: number,
    bottomRadius: number,
    height: number,
    material: MeshStandardMaterial,
    muscleRadius = 0,
    direction: 'down' | 'up' = 'down',
  ): Group {
    const segment = new Group();
    const shaft = new Mesh(new CylinderGeometry(topRadius, bottomRadius, height, 8), material);
    const muscleY = direction === 'down' ? -height * 0.42 : height * 0.42;
    shaft.position.y = direction === 'down' ? -height / 2 : height / 2;
    segment.add(shaft);

    if (muscleRadius > 0) {
      const muscle = new Mesh(new SphereGeometry(muscleRadius, 8, 6), material);
      muscle.position.y = muscleY;
      muscle.scale.set(1.08, 0.72, 1.02);
      segment.add(muscle);
    }

    return segment;
  }

  /**
   * Stylised cultivator built from layered primitives: muscular limbs,
   * split robe panels, tapered torso, back cape, gold trims, glowing dantian
   * core. Colors match PALETTE_HERO in src/combat/art/stickyManPalette.ts.
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
    const hairMat = new MeshStandardMaterial({
      color: 0xf0f4f8,
      roughness: 0.42,
      emissive: 0xc8d0dc,
      emissiveIntensity: 0.18,
    });
    const hairShadowMat = new MeshStandardMaterial({ color: 0xa8b4c4, roughness: 0.48 });
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

    const trouserMat = new MeshStandardMaterial({
      color: 0x586878,
      roughness: 0.62,
      metalness: 0.04,
    });
    const bootMat = new MeshStandardMaterial({ color: 0x3a3848, roughness: 0.7 });

    const shinLen = 0.24;
    const thighLen = 0.26;

    // Legs grow upward from the sole so nothing sits below y = 0.
    for (const side of [-1, 1] as const) {
      const leg = new Group();
      leg.position.set(0.11 * side, 0, 0);

      const foot = this.buildFoot(side, bootMat);
      leg.add(foot);

      const shin = this.buildLimbSegment(0.066, 0.054, shinLen, trouserMat, 0.06, 'up');
      shin.position.y = 0.1;
      leg.add(shin);

      const thigh = this.buildLimbSegment(0.096, 0.072, thighLen, trouserMat, 0.082, 'up');
      thigh.position.y = 0.1 + shinLen;
      leg.add(thigh);

      this.root.add(leg);
    }

    // Split robe panels — hang above the boots (no gold hem ring at the feet).
    for (const [sx, sz, ry] of [
      [-0.16, 0.04, 0.22],
      [0.16, 0.04, -0.22],
      [0, -0.08, 0],
    ] as const) {
      const panel = new Mesh(new BoxGeometry(0.14, 0.36, 0.03), robeMat);
      panel.position.set(sx, 0.28, sz);
      panel.rotation.y = ry;
      this.root.add(panel);
    }

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

    // Hanging front stole (short panels above the sash so legs stay visible).
    for (const sx of [-0.07, 0.07]) {
      const panel = new Mesh(new BoxGeometry(0.06, 0.34, 0.02), robeDarkMat);
      panel.position.set(sx, 0.66, 0.17);
      this.root.add(panel);
    }
    const seam = new Mesh(new BoxGeometry(0.015, 0.32, 0.025), goldMat);
    seam.position.set(0, 0.66, 0.18);
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

    // Shoulders + arms — open outward from the body with palms presented forward.
    const upperArmLen = 0.2;
    const forearmLen = 0.18;
    const armOpenAngle = 0.32;

    for (const side of [-1, 1] as const) {
      const arm = new Group();
      arm.position.set(0.19 * side, 0.9, 0.02);

      const pad = new Mesh(new SphereGeometry(0.1, 10, 10), goldMat);
      arm.add(pad);

      const upperArm = new Group();
      upperArm.position.set(0, -0.1, 0);
      upperArm.rotation.z = armOpenAngle * side;

      const upperArmSeg = this.buildLimbSegment(0.075, 0.062, upperArmLen, skinMat, 0.068);
      upperArm.add(upperArmSeg);

      const forearm = new Group();
      forearm.position.set(0, -upperArmLen, 0);
      forearm.rotation.z = armOpenAngle * 0.45 * side;

      const forearmSeg = this.buildLimbSegment(0.058, 0.048, forearmLen, skinMat, 0.052);
      forearm.add(forearmSeg);

      const hand = this.buildHand(side, skinMat);
      hand.position.set(0, -forearmLen, 0);
      hand.rotation.x = 0.22;
      hand.rotation.z = armOpenAngle * 0.25 * side;
      forearm.add(hand);

      upperArm.add(forearm);
      arm.add(upperArm);

      this.root.add(arm);
      if (side === -1) this.armL = arm;
      else this.armR = arm;
    }

    // Head group (neck, head, icon-matched crown hair, gold band) — subtle nod.
    const headGroup = new Group();
    headGroup.position.y = 1.02;

    const neck = new Mesh(new CylinderGeometry(0.07, 0.08, 0.1, 8), skinMat);
    neck.position.y = -0.06;
    headGroup.add(neck);

    const head = new Mesh(new SphereGeometry(0.155, 16, 16), skinMat);
    headGroup.add(head);

    // Crown hair — flat white cap on top/back (matches icon-512 / drawHeroTopHair).
    const hairDome = new Mesh(
      new SphereGeometry(0.162, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairMat,
    );
    hairDome.position.set(0, 0.02, -0.025);
    hairDome.scale.set(1.04, 0.92, 0.94);
    headGroup.add(hairDome);

    const hairSide = new Mesh(new BoxGeometry(0.05, 0.1, 0.12), hairShadowMat);
    hairSide.position.set(-0.12, 0.03, -0.03);
    headGroup.add(hairSide);

    for (const sx of [-0.055, 0.055]) {
      const eye = new Mesh(new SphereGeometry(0.02, 8, 8), eyeMat);
      eye.position.set(sx, 0.0, 0.14);
      headGroup.add(eye);
    }

    const headband = new Mesh(new TorusGeometry(0.155, 0.018, 8, 20), goldMat);
    headband.position.y = 0.03;
    headband.rotation.x = Math.PI / 2;
    headband.renderOrder = 1;
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
