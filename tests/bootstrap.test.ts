import { describe, expect, it } from 'vitest';
import { createBootState } from '@/app/bootstrap';
import { APP_VERSION, GAME_TITLE } from '@/shared/constants';

describe('bootstrap', () => {
  it('returns ready boot state with title and version', () => {
    const boot = createBootState();

    expect(boot.ready).toBe(true);
    expect(boot.title).toBe(GAME_TITLE);
    expect(boot.version).toBe(APP_VERSION);
  });
});
