import { expect, test } from '@playwright/test';

test.describe('MVP smoke', () => {
  test('boot → home → world map → combat → home → vi locale', async ({ page }) => {
    await page.goto('/');

    const audioUnlock = page.locator('[data-testid="audio-unlock"]');
    if (await audioUnlock.isVisible({ timeout: 5000 }).catch(() => false)) {
      await audioUnlock.click();
    }

    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('tab', { name: 'Play' })).toBeVisible();

    await page.getByRole('button', { name: 'Map Portal' }).click();
    await expect(page.locator('[data-testid="world-map"]')).toBeVisible();

    await page.locator('[data-map-id="map.fallen_village.01"]').click();
    await expect(page.locator('[data-testid="world-map-detail"]')).toBeVisible();
    await page.getByRole('button', { name: 'Enter' }).click();

    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('#canvas-2d');
        return canvas instanceof HTMLCanvasElement && !canvas.classList.contains('canvas--inactive');
      },
      { timeout: 30_000 },
    );

    await page.locator('button[data-scene="home"]').click();
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await page.locator('.home-profile__settings').click();
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();
    await page.locator('label[data-value="vi"]').click();

    await page.locator('.settings-modal__backdrop').click({ force: true });
    await expect(page.getByRole('tab', { name: 'Chơi' })).toBeVisible();
  });
});
