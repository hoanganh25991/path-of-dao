import { describe, expect, it } from 'vitest';
import type { AIEnemyState, AIPlayerState } from '@/combat/ai/AITypes';
import { MeleeChaserAI } from '@/combat/ai/MeleeChaserAI';
import { RangedKiterAI, KITE_BAND_PX } from '@/combat/ai/RangedKiterAI';
import { PatrolAI } from '@/combat/ai/PatrolAI';
import { StationaryAI } from '@/combat/ai/StationaryAI';

function enemyAt(x: number, y: number, overrides: Partial<AIEnemyState> = {}): AIEnemyState {
  return {
    x,
    y,
    spawnX: x,
    spawnY: y,
    speedPxPerSec: 120,
    aggroRange: 200,
    attackRange: 36,
    cooldownReady: true,
    ...overrides,
  };
}

const playerAt = (x: number, y: number, alive = true): AIPlayerState => ({ x, y, alive });

describe('MeleeChaserAI', () => {
  it('moves toward the player when aggroed', () => {
    const d = new MeleeChaserAI().decide(enemyAt(0, 0), playerAt(100, 0), 16);
    expect(d.vx).toBeGreaterThan(0);
    expect(d.vy).toBe(0);
    expect(d.attack).toBe(false);
  });

  it('stays put outside aggro range', () => {
    const d = new MeleeChaserAI().decide(enemyAt(0, 0), playerAt(500, 0), 16);
    expect(d).toEqual({ vx: 0, vy: 0, attack: false });
  });

  it('attacks in range when cooldown is ready', () => {
    const d = new MeleeChaserAI().decide(enemyAt(0, 0), playerAt(30, 0), 16);
    expect(d.attack).toBe(true);
    expect(d.vx).toBe(0);
  });

  it('waits without attacking while on cooldown', () => {
    const d = new MeleeChaserAI().decide(
      enemyAt(0, 0, { cooldownReady: false }),
      playerAt(30, 0),
      16,
    );
    expect(d.attack).toBe(false);
    expect(d.vx).toBe(0);
  });

  it('walks back to spawn when the player is dead', () => {
    const d = new MeleeChaserAI().decide(
      enemyAt(50, 0, { spawnX: 0, spawnY: 0 }),
      playerAt(60, 0, false),
      16,
    );
    expect(d.vx).toBeLessThan(0);
    expect(d.attack).toBe(false);
  });
});

describe('RangedKiterAI', () => {
  const kiter = () => new RangedKiterAI();
  const archer = (x: number) =>
    enemyAt(x, 0, { aggroRange: 260, attackRange: 180 });

  it('flees when the player is too close', () => {
    const d = kiter().decide(archer(0), playerAt(60, 0), 16);
    expect(d.vx).toBeLessThan(0); // away from player
    expect(d.attack).toBe(false);
  });

  it('holds and shoots inside the band', () => {
    const dist = 180 - KITE_BAND_PX / 2;
    const d = kiter().decide(archer(0), playerAt(dist, 0), 16);
    expect(d.vx).toBe(0);
    expect(d.attack).toBe(true);
  });

  it('approaches when between band and aggro range', () => {
    const d = kiter().decide(archer(0), playerAt(220, 0), 16);
    expect(d.vx).toBeGreaterThan(0);
    expect(d.attack).toBe(false);
  });
});

describe('PatrolAI', () => {
  it('walks its waypoint loop until the player aggros', () => {
    const ai = new PatrolAI([
      { x: 0, y: 0 },
      { x: 80, y: 0 },
    ]);
    const enemy = enemyAt(0, 0);

    // at waypoint 0 → advances index, then heads to +80
    ai.decide(enemy, playerAt(1000, 1000), 16);
    const d = ai.decide(enemy, playerAt(1000, 1000), 16);
    expect(d.vx).toBeGreaterThan(0);

    // player enters aggro → chases instead
    const chase = ai.decide(enemy, playerAt(150, 0), 16);
    expect(chase.vx).toBeGreaterThan(0);
  });
});

describe('StationaryAI', () => {
  it('never moves and attacks only in range', () => {
    const totem = enemyAt(0, 0, { attackRange: 90 });
    const near = new StationaryAI().decide(totem, playerAt(50, 0), 16);
    expect(near).toEqual({ vx: 0, vy: 0, attack: true });

    const far = new StationaryAI().decide(totem, playerAt(300, 0), 16);
    expect(far).toEqual({ vx: 0, vy: 0, attack: false });
  });
});
