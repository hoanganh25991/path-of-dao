/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { CultivationToast } from '@/ui/hud/CultivationToast';

describe('CultivationToast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.spyOn(I18nManager, 't').mockImplementation((key, params) => {
      if (key === 'progression.level_up') return `Level up — ${params?.realm ?? ''}`;
      return key;
    });
    CultivationToast.init();
  });

  afterEach(() => {
    CultivationToast.destroy();
    EventBus.clear();
    vi.restoreAllMocks();
  });

  it('shows a single toast on level-up', () => {
    EventBus.emit('progression:level-up', {
      level: 2,
      realmId: 'mortal_body',
      tier: 'mid',
    });

    const toasts = document.querySelectorAll('[data-testid="cultivation-toast"]');
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.textContent).toContain('Level up');
  });

  it('replaces the previous toast instead of stacking', () => {
    EventBus.emit('progression:level-up', {
      level: 2,
      realmId: 'mortal_body',
      tier: 'early',
    });
    EventBus.emit('progression:level-up', {
      level: 3,
      realmId: 'mortal_body',
      tier: 'mid',
    });

    const toasts = document.querySelectorAll('[data-testid="cultivation-toast"]');
    expect(toasts).toHaveLength(1);
  });

  it('removes the toast when its animation ends', () => {
    EventBus.emit('progression:level-up', {
      level: 2,
      realmId: 'mortal_body',
      tier: 'mid',
    });

    const toast = document.querySelector('[data-testid="cultivation-toast"]');
    expect(toast).not.toBeNull();
    toast?.dispatchEvent(new Event('animationend'));

    expect(document.querySelector('[data-testid="cultivation-toast"]')).toBeNull();
  });
});
