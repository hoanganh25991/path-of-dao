import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';

describe('EventBus', () => {
  afterEach(() => {
    EventBus.clear();
  });

  it('delivers payload to subscribers', () => {
    const listener = vi.fn();
    EventBus.on('scene:changed', listener);

    const payload = { id: 'home' as const, payload: undefined };
    EventBus.emit('scene:changed', payload);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(payload);
  });

  it('unsubscribes listeners', () => {
    const listener = vi.fn();
    const unsubscribe = EventBus.on('app:pause', listener);

    unsubscribe();
    EventBus.emit('app:pause', undefined);

    expect(listener).not.toHaveBeenCalled();
  });

  it('preserves listener order', () => {
    const order: number[] = [];
    EventBus.on('app:resume', () => order.push(1));
    EventBus.on('app:resume', () => order.push(2));

    EventBus.emit('app:resume', undefined);

    expect(order).toEqual([1, 2]);
  });
});
