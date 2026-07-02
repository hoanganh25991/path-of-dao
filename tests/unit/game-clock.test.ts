import { describe, expect, it } from 'vitest';
import { GameClock } from '@/core/GameClock';

describe('GameClock', () => {
  it('tracks delta time when not paused', () => {
    GameClock.reset();
    GameClock.tick(1000);
    GameClock.tick(1016);

    expect(GameClock.deltaMs).toBe(16);
    expect(GameClock.elapsedMs).toBe(16);
  });

  it('does not advance while paused', () => {
    GameClock.reset();
    GameClock.tick(1000);
    GameClock.pause();
    GameClock.tick(1032);

    expect(GameClock.deltaMs).toBe(0);
    expect(GameClock.elapsedMs).toBe(0);
  });
});
