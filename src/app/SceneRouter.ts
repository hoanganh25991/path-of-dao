import { EventBus } from '@/core/EventBus';
import { GameShell, type GameShellElements } from '@/app/GameShell';
import type { SceneHost } from '@/app/SceneHost';
import type { SceneId, ScenePayload } from '@/app/SceneId';
import { LoadingOverlay } from '@/ui/LoadingOverlay';

export type SceneHostFactory = (id: SceneId, payload?: unknown) => SceneHost;

export class SceneRouter {
  private static instanceRef: SceneRouter | null = null;

  private currentHost: SceneHost | null = null;
  private currentId: SceneId | null = null;
  private switchChain: Promise<void> = Promise.resolve();

  private constructor(
    private readonly elements: GameShellElements,
    private readonly createHost: SceneHostFactory,
  ) {}

  static init(elements: GameShellElements, createHost: SceneHostFactory): SceneRouter {
    if (!SceneRouter.instanceRef) {
      SceneRouter.instanceRef = new SceneRouter(elements, createHost);
    }
    return SceneRouter.instanceRef;
  }

  static get instance(): SceneRouter {
    if (!SceneRouter.instanceRef) {
      throw new Error('SceneRouter not initialized — call SceneRouter.init() first');
    }
    return SceneRouter.instanceRef;
  }

  static resetForTests(): void {
    SceneRouter.instanceRef = null;
  }

  get current(): SceneId | null {
    return this.currentId;
  }

  get activeHost(): SceneHost | null {
    return this.currentHost;
  }

  switchTo<K extends SceneId>(id: K, payload?: ScenePayload[K]): Promise<void> {
    const run = async (): Promise<void> => {
      const overlay = LoadingOverlay.from(this.elements.loadingOverlay);

      try {
        await overlay.show();

        if (this.currentHost) {
          this.currentHost.pause();
          await this.currentHost.unmount();
          this.currentHost = null;
          this.currentId = null;
        }

        GameShell.setActiveCanvas(this.elements, id);

        const host = this.createHost(id, payload);
        await host.mount(this.elements.gameShell);
        host.resume();

        this.currentHost = host;
        this.currentId = id;

        EventBus.emit('scene:changed', { id, payload });
      } finally {
        await overlay.hide();
      }
    };

    this.switchChain = this.switchChain.then(run, run);
    return this.switchChain;
  }

  pauseActiveHost(): void {
    this.currentHost?.pause();
  }

  resumeActiveHost(): void {
    this.currentHost?.resume();
  }
}
