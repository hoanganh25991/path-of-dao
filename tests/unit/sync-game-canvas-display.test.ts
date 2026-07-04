/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { syncGameCanvasDisplay } from '@/app/orientation/syncGameCanvasDisplay';

describe('syncGameCanvasDisplay', () => {
  it('forces canvas CSS to fill the game shell', () => {
    const canvas = document.createElement('canvas');
    canvas.style.width = '844px';
    canvas.style.height = '390px';
    canvas.style.marginLeft = '120px';
    canvas.style.marginTop = '40px';

    syncGameCanvasDisplay(canvas);

    expect(canvas.style.width).toBe('100%');
    expect(canvas.style.height).toBe('100%');
    expect(canvas.style.marginLeft).toBe('');
    expect(canvas.style.marginTop).toBe('');
  });
});
