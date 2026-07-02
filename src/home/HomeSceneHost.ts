import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  FogExp2,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import type { SceneHost } from '@/app/SceneHost';
import { GameClock } from '@/core/GameClock';

/** Stub Three.js home scene — replaced in sub-plan 10. */
export class HomeSceneHost implements SceneHost {
  readonly id = 'home' as const;

  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private rafId: number | null = null;
  private running = false;
  private readonly onResize = (): void => {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  async mount(container: HTMLElement): Promise<void> {
    const canvas = container.querySelector<HTMLCanvasElement>('#canvas-3d');
    if (!canvas) {
      throw new Error('HomeSceneHost: #canvas-3d not found');
    }

    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.scene = new Scene();
    this.scene.background = new Color(0x0a1628);
    this.scene.fog = new FogExp2(0x0a1628, 0.035);

    this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.5, 4);
    this.camera.lookAt(0, 0.5, 0);

    this.scene.add(new AmbientLight(0x6688aa, 0.6));
    const keyLight = new DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(3, 6, 4);
    this.scene.add(keyLight);

    // Hero Placeholder — replaced in sub-plan 10
    const hero = new Mesh(
      new BoxGeometry(1, 1.6, 0.6),
      new MeshStandardMaterial({ color: 0x3d8b5a }),
    );
    hero.position.y = 0.8;
    this.scene.add(hero);

    window.addEventListener('resize', this.onResize);
    this.running = true;
    this.startLoop();
  }

  async unmount(): Promise<void> {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    window.removeEventListener('resize', this.onResize);

    if (this.scene) {
      this.scene.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        const { material } = object;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material.dispose();
        }
      });
      this.scene = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }

    this.camera = null;
  }

  pause(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume(): void {
    if (this.running && this.rafId === null) {
      this.startLoop();
    } else if (!this.running) {
      this.running = true;
      this.startLoop();
    }
  }

  private startLoop(): void {
    const tick = (now: number): void => {
      if (!this.running || !this.renderer || !this.scene || !this.camera) return;
      GameClock.tick(now);
      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
