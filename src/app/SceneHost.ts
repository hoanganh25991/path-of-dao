import type { SceneId } from '@/app/SceneId';

export interface SceneHost {
  readonly id: SceneId;
  mount(container: HTMLElement): Promise<void>;
  unmount(): Promise<void>;
  pause(): void;
  resume(): void;
}
