/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { AudioManager } from '@/core/audio/AudioManager';
import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';

describe('AudioDirector', () => {
  beforeEach(() => {
    AudioManager.resetForTests();
    vi.stubGlobal('AudioContext', createMockAudioContext());
    AudioManager.init(SaveManager.createNew());
    AudioDirector.mount();
  });

  afterEach(() => {
    AudioDirector.unmount();
    AudioManager.resetForTests();
    EventBus.clear();
    vi.unstubAllGlobals();
  });

  it('maps skill intents to manifest keys', async () => {
    await AudioManager.unlock();
    expect(() => EventBus.emit('skill:cast', { intent: 'lightning' })).not.toThrow();
    expect(() => EventBus.emit('skill:cast', { intent: 'life' })).not.toThrow();
    expect(AudioManager.getSfxEntry('skill.thunder')).toBeDefined();
    expect(AudioManager.getSfxEntry('skill.heal')).toBeDefined();
  });

  it('plays attack and dodge sfx from combat events', async () => {
    await AudioManager.unlock();
    expect(() => EventBus.emit('player:attack-started', { step: 2 })).not.toThrow();
    expect(() => EventBus.emit('player:dodge-started', undefined)).not.toThrow();
  });

  it('plays enemy impact on player hit landed', async () => {
    await AudioManager.unlock();
    expect(() =>
      EventBus.emit('combat:hit-landed', {
        isCrit: false,
        finalDamage: 10,
        skillMultiplier: 1,
        x: 0,
        y: 0,
        attackerTeam: 'player',
        victimTeam: 'cultivator',
      }),
    ).not.toThrow();
  });

  it('plays crit sfx and resolves manifest key', async () => {
    await AudioManager.unlock();
    expect(AudioManager.getSfxEntry('combat.hit.crit')).toBeDefined();
    expect(() =>
      EventBus.emit('combat:hit-landed', {
        isCrit: true,
        finalDamage: 80,
        skillMultiplier: 1,
        x: 0,
        y: 0,
        attackerTeam: 'player',
        victimTeam: 'cultivator',
      }),
    ).not.toThrow();
  });

  it('exposes loot pickup manifest key', () => {
    expect(AudioManager.getSfxEntry('loot.pickup')).toBeDefined();
  });
});

function createMockAudioContext(): typeof AudioContext {
  return class MockAudioContext {
    state = 'running';
    currentTime = 0;
    sampleRate = 44100;
    destination = {};
    createGain() {
      const gainParam = {
        setValueAtTime: vi.fn(),
        value: 1,
        cancelScheduledValues: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      };
      return { connect: vi.fn(), disconnect: vi.fn(), gain: gainParam };
    }
    createOscillator() {
      return {
        type: 'sine',
        detune: { value: 0 },
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 440 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
    }
    createBiquadFilter() {
      return {
        type: 'lowpass',
        frequency: { value: 1000, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        Q: { value: 1 },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }
    createWaveShaper() {
      return { curve: null, oversample: 'none', connect: vi.fn(), disconnect: vi.fn() };
    }
    createBuffer(_channels: number, length: number) {
      return { length, getChannelData: () => new Float32Array(length) };
    }
    createBufferSource() {
      return {
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
    }
    resume = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockResolvedValue(undefined);
  } as unknown as typeof AudioContext;
}
