import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  TorusGeometry,
} from 'three';
import type { EquipmentSlot } from '@/progression/ItemDefinition';

const SLOT_TRANSFORMS: Record<
  EquipmentSlot,
  { position: [number, number, number]; rotation?: [number, number, number]; scale?: number }
> = {
  weapon: { position: [0.42, 0.55, 0.05], rotation: [0, 0, -0.35] },
  armor: { position: [0, 0.55, 0], scale: 1.05 },
  accessory: { position: [0, 0.95, 0.12], scale: 0.6 },
  spirit: { position: [0, 0.75, -0.45], scale: 0.85 },
};

/**
 * Attaches procedural equipment placeholders to the hero rig.
 * GLB models load through the same cache when assets arrive (sub-plan 11 §6).
 */
export class EquipmentAttachment {
  private attached = new Map<EquipmentSlot, Object3D>();
  private modelCache = new Map<string, Group>();
  private spiritPhase = 0;

  constructor(private readonly parent: Object3D) {}

  async attach(slot: EquipmentSlot, modelId: string): Promise<void> {
    this.detach(slot);

    let model = this.modelCache.get(modelId);
    if (!model) {
      model = this.createPlaceholder(slot, modelId);
      this.modelCache.set(modelId, model);
    }

    const instance = model.clone(true);
    this.applySlotTransform(instance, slot);
    this.attached.set(slot, instance);
    this.parent.add(instance);
  }

  detach(slot: EquipmentSlot): void {
    const existing = this.attached.get(slot);
    if (!existing) return;

    this.parent.remove(existing);
    existing.traverse((node) => {
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
    this.attached.delete(slot);
  }

  update(delta: number): void {
    const spirit = this.attached.get('spirit');
    if (!spirit) return;

    this.spiritPhase += delta;
    spirit.position.y = 0.75 + Math.sin(this.spiritPhase * 2.2) * 0.08;
    spirit.rotation.y += delta * 1.4;
  }

  dispose(): void {
    for (const slot of [...this.attached.keys()]) {
      this.detach(slot);
    }

    for (const model of this.modelCache.values()) {
      model.traverse((node) => {
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
    }
    this.modelCache.clear();
  }

  private applySlotTransform(object: Object3D, slot: EquipmentSlot): void {
    const transform = SLOT_TRANSFORMS[slot];
    object.position.set(...transform.position);
    if (transform.rotation) {
      object.rotation.set(...transform.rotation);
    }
    if (transform.scale) {
      object.scale.setScalar(transform.scale);
    }
  }

  private createPlaceholder(slot: EquipmentSlot, modelId: string): Group {
    const group = new Group();
    group.name = modelId;

    const color = colorForModel(modelId);
    const mat = new MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.5 });

    switch (slot) {
      case 'weapon': {
        const blade = new Mesh(new BoxGeometry(0.07, 0.55, 0.04), mat);
        blade.position.y = 0.22;
        group.add(blade);
        const guard = new Mesh(new BoxGeometry(0.18, 0.04, 0.06), mat);
        group.add(guard);
        break;
      }
      case 'armor': {
        const chest = new Mesh(new BoxGeometry(0.38, 0.48, 0.2), mat);
        group.add(chest);
        break;
      }
      case 'accessory': {
        if (modelId.includes('ring')) {
          const ring = new Mesh(new TorusGeometry(0.08, 0.015, 6, 12), mat);
          ring.rotation.x = Math.PI / 2;
          group.add(ring);
        } else {
          const band = new Mesh(new TorusGeometry(0.1, 0.02, 6, 12), mat);
          band.rotation.x = Math.PI / 2;
          group.add(band);
        }
        break;
      }
      case 'spirit': {
        const orb = new Mesh(new BoxGeometry(0.12, 0.12, 0.12), mat);
        group.add(orb);
        break;
      }
    }

    return group;
  }
}

function colorForModel(modelId: string): number {
  if (modelId.includes('iron')) return 0x9aa8b8;
  if (modelId.includes('wood')) return 0x8b6914;
  if (modelId.includes('jade')) return 0x4ecf8a;
  if (modelId.includes('copper')) return 0xc87840;
  if (modelId.includes('speed')) return 0x6ec8ff;
  if (modelId.includes('robe')) return 0x5a7a9a;
  return 0x8899aa;
}
