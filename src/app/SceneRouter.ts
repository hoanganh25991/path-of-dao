import { EventBus } from '@/core/EventBus';
import { GameShell, type GameShellElements } from '@/app/GameShell';
import type { SceneHost } from '@/app/SceneHost';
import type { SceneId, ScenePayload } from '@/app/SceneId';
import { CombatSceneHost } from '@/combat/CombatSceneHost';
import { HomeSceneHost } from '@/home/HomeSceneHost';
import { LoadingOverlay } from '@/ui/LoadingOverlay';

export type SceneHostFactory = (id: SceneId, payload?: unknown) => SceneHost;

const defaultHostFactory: SceneHostFactory = (id, payload) => {
  switch (id) {
    case 'home':
      return new HomeSceneHost();
    case 'combat': {
      const combatPayload = payload as ScenePayload['combat'] | undefined;
      return new CombatSceneHost(combatPayload?.mapId ?? 'test');
    }
    case 'story':
      throw new Error('Story scene host is not implemented yet');
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown scene id: ${_exhaustive}`);
    }
  }
};

export class SceneRouter {
  private static instanceRef: SceneRouter | null = null;

  private currentHost: SceneHost | null = null;
  private currentId: SceneId | null = null;
  private switching = false;
  private switchChain: Promise<void> = Promise.resolve();

  private constructor(
    private readonly elements: GameShellElements,
    private readonly createHost: SceneHostFactory,
  ) {}

  static init(elements: GameShellElements, createHost: SceneHostFactory = defaultHostFactory): SceneRouter {
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
      if (this.switching) {
        throw new Error('SceneRouter: nested switchTo is not supported');
      }

      this.switching = true;
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
        this.switching = false;
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
