import { Scene, WebGLRenderer } from 'three';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { AuraController } from '@/home/AuraController';
import { CameraRig, createHomeCamera } from '@/home/CameraRig';
import { disposeControls, disposeSceneGraph } from '@/home/disposeThree';
import { EnvironmentBuilder } from '@/home/EnvironmentBuilder';
import { HeroViewer } from '@/home/HeroViewer';
import { realmToAuraTier } from '@/home/realmAura';

export interface HomeSceneHandles {
  scene: Scene;
  cameraRig: CameraRig;
  heroViewer: HeroViewer;
  auraController: AuraController;
  environment: EnvironmentBuilder;
}

export class HomeScene {
  private handles: HomeSceneHandles | null = null;

  async build(
    renderer: WebGLRenderer,
    canvas: HTMLCanvasElement,
    save: PlayerSaveV1,
  ): Promise<HomeSceneHandles> {
    const scene = new Scene();
    const camera = createHomeCamera(canvas.clientWidth, canvas.clientHeight);

    const environment = new EnvironmentBuilder();
    environment.build(scene);

    const heroViewer = new HeroViewer(scene);
    await heroViewer.load(save.heroId);
    await heroViewer.syncEquipment(save.equipped);
    heroViewer.playIdle();

    const auraController = new AuraController(scene);
    auraController.setTier(realmToAuraTier(save.realm.id));

    const cameraRig = new CameraRig(camera, canvas);

    this.handles = {
      scene,
      cameraRig,
      heroViewer,
      auraController,
      environment,
    };

    renderer.render(scene, camera);
    return this.handles;
  }

  update(delta: number): void {
    if (!this.handles) return;
    this.handles.heroViewer.update(delta);
    this.handles.auraController.update(delta);
    this.handles.environment.update(delta);
    this.handles.cameraRig.update();
  }

  render(renderer: WebGLRenderer): void {
    if (!this.handles) return;
    renderer.render(this.handles.scene, this.handles.cameraRig.controls.object);
  }

  get cameraRig(): CameraRig | null {
    return this.handles?.cameraRig ?? null;
  }

  async syncEquipment(equipped: PlayerSaveV1['equipped']): Promise<void> {
    if (!this.handles) return;
    await this.handles.heroViewer.syncEquipment(equipped);
  }

  updateAura(realmId: string): void {
    if (!this.handles) return;
    this.handles.auraController.setTier(realmToAuraTier(realmId));
  }

  dispose(): void {
    if (!this.handles) return;

    this.handles.heroViewer.root.removeFromParent();
    this.handles.auraController.root.removeFromParent();
    this.handles.environment.root.removeFromParent();

    disposeControls(this.handles.cameraRig.controls);
    disposeSceneGraph(this.handles.scene);

    this.handles = null;
  }
}
