/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FullscreenManager } from '@/app/FullscreenManager';

describe('FullscreenManager', () => {
  beforeEach(() => {
    FullscreenManager.resetForTests();
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    FullscreenManager.resetForTests();
    vi.restoreAllMocks();
  });

  it('requests fullscreen on #app when supported', async () => {
    const root = document.getElementById('app')!;
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    root.requestFullscreen = requestFullscreen;

    FullscreenManager.mount(root);
    FullscreenManager.requestOnPlay();

    await vi.waitFor(() => {
      expect(requestFullscreen).toHaveBeenCalledOnce();
    });
  });

  it('skips when user opted out recently', async () => {
    const root = document.getElementById('app')!;
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    root.requestFullscreen = requestFullscreen;
    localStorage.setItem('pod.fullscreen.dismissedAt', String(Date.now()));

    FullscreenManager.mount(root);
    FullscreenManager.requestOnPlay();

    await Promise.resolve();
    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it('records opt-out when fullscreen exits', () => {
    const root = document.getElementById('app')!;
    FullscreenManager.mount(root);

    document.dispatchEvent(new Event('fullscreenchange'));
    expect(localStorage.getItem('pod.fullscreen.dismissedAt')).not.toBeNull();
  });

  it('skips in standalone PWA display mode', async () => {
    const root = document.getElementById('app')!;
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    root.requestFullscreen = requestFullscreen;

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    );

    FullscreenManager.mount(root);
    expect(FullscreenManager.isSupported()).toBe(false);
    FullscreenManager.requestOnPlay();

    await Promise.resolve();
    expect(requestFullscreen).not.toHaveBeenCalled();
  });
});
