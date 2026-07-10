import {
  BackSide,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
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
 * Invoker-inspired cultivator silhouette: ornate pauldrons, layered robe,
 * orbiting spirit orbs, glowing dantian — Path of Dao palette (slate / gold / cyan).
 * GLB assets (`assets/models/hero/wanderer.glb`) are not bundled yet.
 */
export class HeroViewer {
  readonly root = new Group();
  private idlePhase = 0;
  private petPhase = 0;
  private petMesh: Mesh | null = null;
  private equipment: EquipmentAttachment;

  private torso: Mesh | null = null;
  private armL: Group | null = null;
  private armR: Group | null = null;
  private sash: Mesh | null = null;
  private cape: Group | null = null;
  private core: Mesh | null = null;
  private coreHalo: Mesh | null = null;
  private headGroup: Group | null = null;
  private spiritOrbs: Group | null = null;
  private qiRing: Mesh | null = null;
  private robePanels: Group | null = null;
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
    const bob = Math.sin(p * 1.8) * 0.018;
    this.root.position.y = this.standY + bob;
    this.root.rotation.y = Math.sin(p * 0.45) * 0.08;

    if (this.torso) this.torso.scale.setY(1 + Math.sin(p * 2.1) * 0.015);
    if (this.headGroup) this.headGroup.rotation.x = Math.sin(p * 1.5) * 0.035;
    if (this.armL) {
      this.armL.rotation.x = Math.sin(p * 1.6) * 0.05;
      this.armL.rotation.z = Math.sin(p * 1.3) * 0.025;
    }
    if (this.armR) {
      this.armR.rotation.x = -Math.sin(p * 1.6) * 0.05;
      this.armR.rotation.z = -Math.sin(p * 1.3) * 0.025;
    }
    if (this.sash) this.sash.rotation.z = Math.PI / 2 + Math.sin(p * 1.35) * 0.05;
    if (this.cape) this.cape.rotation.x = Math.sin(p * 1.1) * 0.03;
    if (this.robePanels) {
      this.robePanels.rotation.y = Math.sin(p * 0.9) * 0.03;
    }
    if (this.core) {
      const mat = this.core.material as MeshStandardMaterial;
      mat.emissiveIntensity = 1.4 + Math.sin(p * 3.2) * 0.6;
      this.core.rotation.y += delta * 1.6;
    }
    if (this.coreHalo) {
      this.coreHalo.rotation.z += delta * 1.2;
      const mat = this.coreHalo.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.7 + Math.sin(p * 2.8) * 0.35;
    }
    if (this.qiRing) {
      this.qiRing.rotation.y += delta * 0.9;
      this.qiRing.position.y = 0.72 + Math.sin(p * 2) * 0.02;
    }
    if (this.spiritOrbs) {
      this.spiritOrbs.rotation.y += delta * 1.15;
      const children = this.spiritOrbs.children;
      for (let i = 0; i < children.length; i++) {
        const orb = children[i]!;
        orb.position.y = Math.sin(p * 2.4 + i * 2.1) * 0.06;
        orb.rotation.y += delta * (1.5 + i * 0.3);
      }
    }
    this.equipment.update(delta);

    if (this.petMesh) {
      const orbit = this.petPhase * 1.4;
      this.petMesh.position.set(
        Math.cos(orbit) * 0.55,
        0.85 + Math.sin(orbit * 2) * 0.06,
        Math.sin(orbit) * 0.35,
      );
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

  /** Low-poly open palm + stub fingers; origin sits at the wrist joint. */
  private buildHand(side: -1 | 1, skinMat: MeshStandardMaterial): Group {
    const hand = new Group();
    const knuckle = new Mesh(new SphereGeometry(0.022, 6, 6), skinMat);
    knuckle.scale.set(1.1, 0.75, 0.9);
    hand.add(knuckle);

    const palm = new Mesh(new BoxGeometry(0.055, 0.06, 0.02), skinMat);
    palm.position.set(0, -0.032, 0.01);
    palm.rotation.x = 0.18;
    hand.add(palm);

    for (let i = 0; i < 4; i++) {
      const finger = new Mesh(new BoxGeometry(0.01, 0.036, 0.014), skinMat);
      const spread = (i - 1.5) * 0.012;
      finger.position.set(spread * side, -0.068, 0.012 + Math.abs(spread) * 0.2);
      finger.rotation.x = 0.12;
      finger.rotation.z = spread * 0.55 * side;
      hand.add(finger);
    }

    const thumb = new Mesh(new BoxGeometry(0.012, 0.028, 0.014), skinMat);
    thumb.position.set(0.034 * side, -0.044, 0.02);
    thumb.rotation.z = -0.65 * side;
    thumb.rotation.x = 0.2;
    hand.add(thumb);

    return hand;
  }

  /** Low-poly boot: sole + toe box + ankle cuff; origin at the ground contact. */
  private buildFoot(side: -1 | 1, bootMat: MeshStandardMaterial): Group {
    const foot = new Group();

    const sole = new Mesh(new BoxGeometry(0.09, 0.024, 0.16), bootMat);
    sole.position.set(0.006 * side, 0.012, 0.028);
    foot.add(sole);

    const toe = new Mesh(new BoxGeometry(0.082, 0.034, 0.06), bootMat);
    toe.position.set(0.006 * side, 0.028, 0.078);
    toe.rotation.x = -0.08;
    foot.add(toe);

    const vamp = new Mesh(new BoxGeometry(0.078, 0.048, 0.08), bootMat);
    vamp.position.set(0.004 * side, 0.04, 0.008);
    foot.add(vamp);

    const ankle = new Mesh(new CylinderGeometry(0.038, 0.044, 0.055, 8), bootMat);
    ankle.position.set(0, 0.065, -0.018);
    foot.add(ankle);

    return foot;
  }

  /** Ornate Invoker-style pauldron — layered gold plates + spirit gem. */
  private buildPauldron(
    side: -1 | 1,
    goldMat: MeshStandardMaterial,
    gemMat: MeshStandardMaterial,
  ): Group {
    const pad = new Group();

    const dome = new Mesh(new SphereGeometry(0.095, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.68), goldMat);
    dome.scale.set(1.2, 0.9, 1.1);
    dome.rotation.z = -0.28 * side;
    pad.add(dome);

    const plate = new Mesh(new BoxGeometry(0.1, 0.06, 0.12), goldMat);
    plate.position.set(0.02 * side, -0.02, 0.02);
    plate.rotation.z = -0.2 * side;
    pad.add(plate);

    const spike = new Mesh(new ConeGeometry(0.035, 0.12, 6), goldMat);
    spike.position.set(0.045 * side, 0.085, 0);
    spike.rotation.z = -0.5 * side;
    pad.add(spike);

    const gem = new Mesh(new SphereGeometry(0.028, 10, 10), gemMat);
    gem.position.set(0.01 * side, 0.02, 0.085);
    pad.add(gem);

    return pad;
  }

  /**
   * Áo choàng — high-collar mage coat: shoulder capelet, long back panels,
   * side flaps, gold edge trim (Invoker-style volume).
   */
  private buildCoat(
    robeMat: MeshStandardMaterial,
    robeDarkMat: MeshStandardMaterial,
    goldMat: MeshStandardMaterial,
  ): Group {
    const coat = new Group();

    // High standing collar behind the neck
    const collarBack = new Mesh(new BoxGeometry(0.22, 0.16, 0.04), robeDarkMat);
    collarBack.position.set(0, 1.12, -0.08);
    collarBack.rotation.x = -0.25;
    coat.add(collarBack);

    for (const side of [-1, 1] as const) {
      const collarWing = new Mesh(new BoxGeometry(0.08, 0.14, 0.035), robeDarkMat);
      collarWing.position.set(0.12 * side, 1.1, -0.04);
      collarWing.rotation.y = -0.45 * side;
      collarWing.rotation.x = -0.15;
      coat.add(collarWing);
    }

    const collarTrim = new Mesh(new BoxGeometry(0.2, 0.02, 0.045), goldMat);
    collarTrim.position.set(0, 1.18, -0.08);
    collarTrim.rotation.x = -0.25;
    coat.add(collarTrim);

    // Shoulder capelet — drapes over pauldrons
    for (const side of [-1, 1] as const) {
      const capelet = new Mesh(new BoxGeometry(0.16, 0.08, 0.2), robeMat);
      capelet.position.set(0.14 * side, 1.0, -0.02);
      capelet.rotation.z = -0.35 * side;
      capelet.rotation.x = 0.15;
      coat.add(capelet);
    }

    // Long back coat panels (áo choàng body)
    const backOuter = new Mesh(new BoxGeometry(0.36, 0.85, 0.04), robeDarkMat);
    backOuter.position.set(0, 0.55, -0.16);
    backOuter.rotation.x = 0.08;
    coat.add(backOuter);

    const backInner = new Mesh(
      new BoxGeometry(0.28, 0.78, 0.03),
      new MeshStandardMaterial({
        color: 0x243848,
        roughness: 0.5,
        emissive: 0x102030,
        emissiveIntensity: 0.3,
        side: DoubleSide,
      }),
    );
    backInner.position.set(0, 0.52, -0.13);
    backInner.rotation.x = 0.06;
    coat.add(backInner);

    // Side coat flaps hanging from shoulders
    for (const side of [-1, 1] as const) {
      const flap = new Mesh(new BoxGeometry(0.12, 0.7, 0.03), robeMat);
      flap.position.set(0.2 * side, 0.58, -0.06);
      flap.rotation.y = 0.55 * side;
      flap.rotation.z = 0.08 * side;
      coat.add(flap);

      const flapTrim = new Mesh(new BoxGeometry(0.02, 0.68, 0.035), goldMat);
      flapTrim.position.set(0.26 * side, 0.58, -0.04);
      flapTrim.rotation.y = 0.55 * side;
      coat.add(flapTrim);
    }

    // Hem gold trim across back
    const hem = new Mesh(new BoxGeometry(0.34, 0.025, 0.05), goldMat);
    hem.position.set(0, 0.14, -0.18);
    hem.rotation.x = 0.08;
    coat.add(hem);

    // Front open coat edges (frames the chest, doesn't cover core)
    for (const side of [-1, 1] as const) {
      const frontEdge = new Mesh(new BoxGeometry(0.06, 0.55, 0.025), robeDarkMat);
      frontEdge.position.set(0.14 * side, 0.72, 0.1);
      frontEdge.rotation.y = -0.35 * side;
      coat.add(frontEdge);
    }

    return coat;
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
   * Invoker-inspired cultivator: strong shoulders, layered robe, three
   * orbiting spirit orbs, glowing dantian + qi ring. Palette matches
   * PALETTE_HERO (slate robe, gold trim, cyan spirit).
   */
  private buildProceduralHero(): void {
    const robeMat = new MeshStandardMaterial({
      color: 0xb8c4d4,
      roughness: 0.48,
      metalness: 0.08,
      emissive: 0x2a3848,
      emissiveIntensity: 0.22,
    });
    const robeDarkMat = new MeshStandardMaterial({
      color: 0x4a5868,
      roughness: 0.55,
      metalness: 0.06,
      emissive: 0x1a2430,
      emissiveIntensity: 0.15,
    });
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
      metalness: 0.78,
      roughness: 0.22,
      emissive: 0x4a3808,
      emissiveIntensity: 0.45,
    });
    const coreMat = new MeshStandardMaterial({
      color: 0x0a3a44,
      emissive: 0x66e0ff,
      emissiveIntensity: 1.6,
      roughness: 0.15,
      metalness: 0.2,
    });
    const spiritCyan = new MeshStandardMaterial({
      color: 0x1a6080,
      emissive: 0x44d0ff,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const spiritGold = new MeshStandardMaterial({
      color: 0x806020,
      emissive: 0xffc040,
      emissiveIntensity: 1.35,
      roughness: 0.25,
    });
    const spiritJade = new MeshStandardMaterial({
      color: 0x186048,
      emissive: 0x40e8a0,
      emissiveIntensity: 1.4,
      roughness: 0.22,
    });
    const trouserMat = new MeshStandardMaterial({
      color: 0x3a4858,
      roughness: 0.6,
      metalness: 0.05,
    });
    const bootMat = new MeshStandardMaterial({ color: 0x2a2838, roughness: 0.68 });

    const shinLen = 0.28;
    const thighLen = 0.3;

    // ── Legs ──
    for (const side of [-1, 1] as const) {
      const leg = new Group();
      leg.position.set(0.085 * side, 0, 0);

      const foot = this.buildFoot(side, bootMat);
      leg.add(foot);

      const shin = this.buildLimbSegment(0.052, 0.042, shinLen, trouserMat, 0.048, 'up');
      shin.position.y = 0.095;
      leg.add(shin);

      const thigh = this.buildLimbSegment(0.07, 0.055, thighLen, trouserMat, 0.062, 'up');
      thigh.position.y = 0.095 + shinLen;
      leg.add(thigh);

      this.root.add(leg);
    }

    // ── Flowing lower robe (layered panels) ──
    const robePanels = new Group();
    const panelSpecs: Array<[number, number, number, number, number]> = [
      [-0.08, 0.04, 0.22, 0.1, 0.42],
      [0.08, 0.04, -0.22, 0.1, 0.42],
      [-0.12, -0.02, 0.4, 0.08, 0.38],
      [0.12, -0.02, -0.4, 0.08, 0.38],
      [0, -0.07, 0, 0.12, 0.44],
    ];
    for (const [sx, sz, ry, w, h] of panelSpecs) {
      const panel = new Mesh(new BoxGeometry(w, h, 0.022), Math.abs(sx) > 0.1 ? robeDarkMat : robeMat);
      panel.position.set(sx, 0.28, sz);
      panel.rotation.y = ry;
      robePanels.add(panel);
    }
    this.robePanels = robePanels;
    this.root.add(robePanels);

    // Gold hem trim on front panel
    const hemTrim = new Mesh(new BoxGeometry(0.11, 0.018, 0.028), goldMat);
    hemTrim.position.set(0, 0.08, -0.07);
    this.root.add(hemTrim);

    // ── Athletic torso (shoulder flare → narrow waist) ──
    const torso = new Mesh(new CylinderGeometry(0.155, 0.115, 0.48, 14), robeMat);
    torso.position.y = 0.82;
    this.torso = torso;
    this.root.add(torso);

    // Chest plate overlay — strong cultivator chest
    const chest = new Mesh(new SphereGeometry(0.12, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), robeDarkMat);
    chest.position.set(0, 0.9, 0.04);
    chest.scale.set(1.15, 0.7, 0.85);
    this.root.add(chest);

    // Collar / high neck trim
    const collar = new Mesh(new TorusGeometry(0.1, 0.018, 8, 20), goldMat);
    collar.position.set(0, 1.04, 0.02);
    collar.rotation.x = Math.PI / 2.4;
    this.root.add(collar);

    // V-lapel
    const lapel = new Mesh(new ConeGeometry(0.065, 0.18, 3, 1, true), robeDarkMat);
    lapel.position.set(0, 0.95, 0.12);
    lapel.rotation.x = Math.PI;
    this.root.add(lapel);

    // Dantian core + halo ring
    const core = new Mesh(new SphereGeometry(0.048, 14, 14), coreMat);
    core.position.set(0, 0.78, 0.14);
    this.core = core;
    this.root.add(core);

    const coreHalo = new Mesh(
      new TorusGeometry(0.07, 0.01, 8, 24),
      new MeshStandardMaterial({
        color: 0x2288aa,
        emissive: 0x44d0ff,
        emissiveIntensity: 0.9,
        roughness: 0.3,
        metalness: 0.4,
      }),
    );
    coreHalo.position.copy(core.position);
    coreHalo.rotation.x = Math.PI / 2.5;
    this.coreHalo = coreHalo;
    this.root.add(coreHalo);

    // Front stole with gold seam
    for (const sx of [-0.04, 0.04]) {
      const stole = new Mesh(new BoxGeometry(0.035, 0.32, 0.016), robeDarkMat);
      stole.position.set(sx, 0.76, 0.13);
      this.root.add(stole);
    }
    const seam = new Mesh(new BoxGeometry(0.012, 0.3, 0.02), goldMat);
    seam.position.set(0, 0.76, 0.135);
    this.root.add(seam);

    // Waist sash
    const sash = new Mesh(new TorusGeometry(0.12, 0.024, 8, 22), goldMat);
    sash.position.y = 0.56;
    sash.rotation.z = Math.PI / 2;
    sash.rotation.x = Math.PI / 2;
    this.sash = sash;
    this.root.add(sash);

    // Sash knot / pendant
    const pendant = new Mesh(new ConeGeometry(0.03, 0.08, 5), goldMat);
    pendant.position.set(0, 0.48, 0.12);
    pendant.rotation.x = Math.PI;
    this.root.add(pendant);

    // ── Áo choàng (high-collar mage coat) ──
    const cape = this.buildCoat(robeMat, robeDarkMat, goldMat);
    this.cape = cape;
    this.root.add(cape);

    // ── Arms + ornate pauldrons (shoulder joint bridges pad → limb) ──
    const upperArmLen = 0.24;
    const forearmLen = 0.2;
    const armOpenAngle = 0.22;

    for (const side of [-1, 1] as const) {
      const arm = new Group();
      arm.position.set(0.16 * side, 0.98, 0.02);

      // Skin shoulder ball — visually connects torso/pauldron to the arm
      const shoulderJoint = new Mesh(new SphereGeometry(0.055, 10, 10), skinMat);
      shoulderJoint.position.set(0.01 * side, 0, 0);
      arm.add(shoulderJoint);

      const pauldron = this.buildPauldron(side, goldMat, side === -1 ? spiritCyan : spiritGold);
      pauldron.position.set(0.03 * side, 0.04, 0);
      arm.add(pauldron);

      // Upper arm starts inside the pauldron so there is no floating gap
      const upperArm = new Group();
      upperArm.position.set(0.015 * side, -0.02, 0);
      upperArm.rotation.z = armOpenAngle * side;

      const upperArmSeg = this.buildLimbSegment(0.05, 0.042, upperArmLen, skinMat, 0.046);
      upperArm.add(upperArmSeg);

      // Sleeve cuff under pauldron — bridges armor to flesh
      const sleeve = new Mesh(new CylinderGeometry(0.058, 0.05, 0.1, 8), robeDarkMat);
      sleeve.position.y = -0.04;
      upperArm.add(sleeve);

      const bracer = new Mesh(new CylinderGeometry(0.048, 0.044, 0.08, 8), goldMat);
      bracer.position.y = -upperArmLen * 0.55;
      upperArm.add(bracer);

      const forearm = new Group();
      forearm.position.set(0, -upperArmLen, 0);
      forearm.rotation.z = armOpenAngle * 0.3 * side;
      forearm.rotation.x = -0.12;

      const forearmSeg = this.buildLimbSegment(0.04, 0.032, forearmLen, skinMat, 0.036);
      forearm.add(forearmSeg);

      const hand = this.buildHand(side, skinMat);
      hand.position.set(0, -forearmLen, 0);
      hand.rotation.x = 0.25;
      hand.rotation.z = armOpenAngle * 0.2 * side;
      forearm.add(hand);

      const spark = new Mesh(new SphereGeometry(0.018, 8, 8), side === -1 ? spiritJade : spiritCyan);
      spark.position.set(0, -forearmLen - 0.05, 0.03);
      forearm.add(spark);

      upperArm.add(forearm);
      arm.add(upperArm);

      this.root.add(arm);
      if (side === -1) this.armL = arm;
      else this.armR = arm;
    }

    // ── Head ──
    const headGroup = new Group();
    headGroup.position.y = 1.14;

    const neck = new Mesh(new CylinderGeometry(0.055, 0.065, 0.09, 8), skinMat);
    neck.position.y = -0.055;
    headGroup.add(neck);

    const head = new Mesh(new SphereGeometry(0.14, 16, 16), skinMat);
    headGroup.add(head);

    const hairDome = new Mesh(
      new SphereGeometry(0.148, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat,
    );
    hairDome.position.set(0, 0.015, -0.02);
    hairDome.scale.set(1.05, 0.95, 0.96);
    headGroup.add(hairDome);

    // Longer side locks (Invoker-adjacent mage hair)
    for (const sx of [-1, 1] as const) {
      const lock = new Mesh(new BoxGeometry(0.04, 0.14, 0.05), hairShadowMat);
      lock.position.set(0.1 * sx, -0.02, -0.02);
      lock.rotation.z = 0.15 * sx;
      headGroup.add(lock);
    }

    for (const sx of [-0.048, 0.048]) {
      const eye = new Mesh(new SphereGeometry(0.018, 8, 8), eyeMat);
      eye.position.set(sx, 0.01, 0.125);
      headGroup.add(eye);
    }

    // Glowing mage eyes hint
    const eyeGlowMat = new MeshStandardMaterial({
      color: 0x66e0ff,
      emissive: 0x44c0ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.35,
    });
    for (const sx of [-0.048, 0.048]) {
      const glow = new Mesh(new SphereGeometry(0.024, 8, 8), eyeGlowMat);
      glow.position.set(sx, 0.01, 0.12);
      headGroup.add(glow);
    }

    const headband = new Mesh(new TorusGeometry(0.14, 0.016, 8, 22), goldMat);
    headband.position.y = 0.025;
    headband.rotation.x = Math.PI / 2;
    headband.renderOrder = 1;
    headGroup.add(headband);

    // Forehead spirit gem
    const browGem = new Mesh(new SphereGeometry(0.022, 10, 10), spiritCyan);
    browGem.position.set(0, 0.06, 0.13);
    headGroup.add(browGem);

    this.headGroup = headGroup;
    this.root.add(headGroup);

    // ── Three orbiting spirit orbs (Invoker-style) ──
    const spiritOrbs = new Group();
    spiritOrbs.position.set(0, 0.85, 0);
    const orbMats = [spiritCyan, spiritGold, spiritJade];
    const orbRadius = 0.42;
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const orbGroup = new Group();
      orbGroup.position.set(Math.cos(angle) * orbRadius, 0, Math.sin(angle) * orbRadius);

      const orb = new Mesh(new SphereGeometry(0.055, 12, 12), orbMats[i]!);
      orbGroup.add(orb);

      const ring = new Mesh(
        new TorusGeometry(0.075, 0.008, 6, 16),
        new MeshStandardMaterial({
          color: 0xffffff,
          emissive: orbMats[i]!.emissive,
          emissiveIntensity: 0.6,
          roughness: 0.4,
          metalness: 0.3,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      orbGroup.add(ring);

      spiritOrbs.add(orbGroup);
    }
    this.spiritOrbs = spiritOrbs;
    this.root.add(spiritOrbs);

    // Horizontal qi ring around mid torso
    const qiRing = new Mesh(
      new TorusGeometry(0.28, 0.012, 8, 32),
      new MeshStandardMaterial({
        color: 0x2288aa,
        emissive: 0x44d0ff,
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.55,
        roughness: 0.35,
        metalness: 0.2,
      }),
    );
    qiRing.position.y = 0.72;
    qiRing.rotation.x = Math.PI / 2;
    this.qiRing = qiRing;
    this.root.add(qiRing);

    // Soft ground glow
    const glow = new Mesh(
      new SphereGeometry(0.55, 16, 8),
      new MeshStandardMaterial({
        color: 0x66e0ff,
        emissive: 0x3388aa,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.14,
        side: BackSide,
        depthWrite: false,
      }),
    );
    glow.scale.set(1, 0.1, 1);
    glow.position.y = 0.02;
    this.root.add(glow);
  }
}

export type { EquipmentSlot };
