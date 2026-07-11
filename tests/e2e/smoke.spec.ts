import { expect, test } from '@playwright/test';

async function dismissAudioUnlock(page: import('@playwright/test').Page): Promise<void> {
  const audioUnlock = page.locator('[data-testid="audio-unlock"]');
  if (await audioUnlock.isVisible({ timeout: 5000 }).catch(() => false)) {
    await audioUnlock.click();
  }
}

async function dismissEncounterIfPresent(page: import('@playwright/test').Page): Promise<void> {
  const encounterModal = page.locator('[data-testid="encounter-modal"]');
  if (await encounterModal.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.getByRole('button', { name: 'Embrace the Dao' }).click();
    await expect(encounterModal).toBeHidden({ timeout: 10_000 });
  }
}

async function waitForCombatCanvas(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('#canvas-2d');
      return canvas instanceof HTMLCanvasElement && !canvas.classList.contains('canvas--inactive');
    },
    { timeout: 30_000 },
  );
}

/** `window.__podErrors` is a live ring buffer (see ErrorReporter.ts); undefined counts as clean. */
async function expectNoPodErrors(page: import('@playwright/test').Page): Promise<void> {
  const errors = await page.evaluate(
    () => (window as unknown as { __podErrors?: readonly string[] }).__podErrors ?? [],
  );
  expect(errors).toHaveLength(0);
}

async function returnHomeViaPause(page: import('@playwright/test').Page): Promise<void> {
  await page.getByTestId('combat-pause-btn').click();
  await expect(page.getByTestId('combat-pause-menu')).toBeVisible();
  await page.getByRole('button', { name: 'Return Home' }).click();
  await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
}

test.describe('MVP smoke', () => {
  test('boot → Begin Journey → combat → home → Continue again → vi locale', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);

    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('tab', { name: 'Journey' })).toBeVisible();

    await expect(page.getByTestId('continue-journey-btn')).toBeVisible();
    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Begin Journey');
    await expect(page.getByTestId('continue-journey-hint')).toContainText('Next:');

    await page.getByTestId('continue-journey-btn').click();
    await waitForCombatCanvas(page);
    await dismissEncounterIfPresent(page);
    await expectNoPodErrors(page);
    await returnHomeViaPause(page);

    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Continue Journey');
    await page.getByTestId('continue-journey-btn').click();
    await waitForCombatCanvas(page);
    await dismissEncounterIfPresent(page);
    await expectNoPodErrors(page);
    await returnHomeViaPause(page);

    await page.locator('.home-profile__settings').click();
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();
    await page.locator('label[data-value="vi"]').click();

    await page.locator('.settings-modal__backdrop').click({ force: true });
    await expect(page.getByRole('tab', { name: 'Hành Trình' })).toBeVisible();
  });
});
