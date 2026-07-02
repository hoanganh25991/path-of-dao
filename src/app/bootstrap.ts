import { APP_VERSION, GAME_TITLE } from '@/shared/constants';

export interface BootResult {
  title: string;
  version: string;
  ready: boolean;
}

/** Validates core bootstrap state before scenes mount. */
export function createBootState(): BootResult {
  return {
    title: GAME_TITLE,
    version: APP_VERSION,
    ready: true,
  };
}
