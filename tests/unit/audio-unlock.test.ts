/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { AudioUnlock } from '@/core/audio/AudioUnlock';
import { AudioManager } from '@/core/audio/AudioManager';
import { SaveManager } from '@/core/save/SaveManager';

describe('AudioUnlock', () => {
  beforeEach(() => {
    AudioManager.resetForTests();
    AudioUnlock.resetForTests();
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    AudioManager.resetForTests();
    AudioUnlock.resetForTests();
  });

  it('shows overlay only when audio was never unlocked on this device', () => {
    const root = document.getElementById('app')!;
    AudioUnlock.mount(root);
    expect(document.querySelector('[data-testid="audio-unlock"]')).not.toBeNull();
  });

  it('skips overlay when unlock was persisted', () => {
    localStorage.setItem('pod.audio.unlocked', '1');
    const root = document.getElementById('app')!;
    AudioUnlock.mount(root);
    expect(document.querySelector('[data-testid="audio-unlock"]')).toBeNull();
  });

  it('persists unlock after first dismiss', async () => {
    class MockAudioContext {
      state = 'running';
      currentTime = 0;
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
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 440 },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn(),
        };
      }
      resume = vi.fn().mockResolvedValue(undefined);
      close = vi.fn().mockResolvedValue(undefined);
    }

    vi.stubGlobal('AudioContext', MockAudioContext);
    AudioManager.init(SaveManager.createNew());
    const root = document.getElementById('app')!;
    AudioUnlock.mount(root);
    await AudioManager.unlock();
    expect(localStorage.getItem('pod.audio.unlocked')).toBe('1');
    expect(AudioManager.hasPersistedUnlock()).toBe(true);
    vi.unstubAllGlobals();
  });
});
