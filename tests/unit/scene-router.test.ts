/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GameShell } from '@/app/GameShell';
import { SceneRouter } from '@/app/SceneRouter';
import type { SceneHost } from '@/app/SceneHost';
import type { SceneId } from '@/app/SceneId';

class MockSceneHost implements SceneHost {
  readonly mountCalls: unknown[] = [];
  unmountCount = 0;
  pauseCount = 0;
  resumeCount = 0;

  constructor(public readonly id: SceneId) {}

  async mount(_container: HTMLElement): Promise<void> {
    this.mountCalls.push(this.id);
  }

  async unmount(): Promise<void> {
    this.unmountCount += 1;
  }

  pause(): void {
    this.pauseCount += 1;
  }

  resume(): void {
    this.resumeCount += 1;
  }
}

describe('SceneRouter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    SceneRouter.resetForTests();
  });

  it('disposes the previous host when switching scenes', async () => {
    const hosts: MockSceneHost[] = [];
    const elements = GameShell.mount(document.getElementById('app')!);
    const router = SceneRouter.init(elements, (id) => {
      const host = new MockSceneHost(id);
      hosts.push(host);
      return host;
    });

    await router.switchTo('home');
    await router.switchTo('combat', { mapId: 'test' });

    expect(hosts).toHaveLength(2);
    expect(hosts[0]?.unmountCount).toBe(1);
    expect(hosts[1]?.mountCalls).toEqual(['combat']);
    expect(router.current).toBe('combat');
  });

  it('re-mounts when switching to the same scene with a new payload', async () => {
    const hosts: MockSceneHost[] = [];
    const elements = GameShell.mount(document.getElementById('app')!);
    const router = SceneRouter.init(elements, (id) => {
      const host = new MockSceneHost(id);
      hosts.push(host);
      return host;
    });

    await router.switchTo('combat', { mapId: 'alpha' });
    await router.switchTo('combat', { mapId: 'beta' });

    expect(hosts).toHaveLength(2);
    expect(hosts[0]?.unmountCount).toBe(1);
    expect(hosts[1]?.mountCalls).toEqual(['combat']);
  });

  it('serializes concurrent switchTo calls', async () => {
    const order: string[] = [];
    const elements = GameShell.mount(document.getElementById('app')!);
    const router = SceneRouter.init(elements, (id) => {
      return {
        id,
        mount: async () => {
          order.push(`mount:${id}`);
        },
        unmount: async () => {
          order.push(`unmount:${id}`);
        },
        pause: () => undefined,
        resume: () => undefined,
      } satisfies SceneHost;
    });

    await Promise.all([
      router.switchTo('home'),
      router.switchTo('combat', { mapId: 'test' }),
    ]);

    expect(order.indexOf('unmount:home')).toBeLessThan(order.indexOf('mount:combat'));
    expect(router.current).toBe('combat');
  });
});
