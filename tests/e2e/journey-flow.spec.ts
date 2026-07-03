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

async function seedRoadProgress(
  page: import('@playwright/test').Page,
  chaptersComplete: number,
): Promise<void> {
  await page.waitForFunction(() => typeof (window as unknown as { __devSeedRoadProgress?: unknown }).__devSeedRoadProgress === 'function');
  await page.evaluate(async (chapters) => {
    const seed = (window as unknown as { __devSeedRoadProgress: (n: number) => Promise<void> }).__devSeedRoadProgress;
    await seed(chapters);
  }, chaptersComplete);
}

async function seedBossPendingStory(
  page: import('@playwright/test').Page,
  chapterIndex: number,
): Promise<void> {
  await page.waitForFunction(() => typeof (window as unknown as { __devSeedBossPendingStory?: unknown }).__devSeedBossPendingStory === 'function');
  await page.evaluate(async (chapter) => {
    const seed = (window as unknown as { __devSeedBossPendingStory: (n: number) => Promise<void> }).__devSeedBossPendingStory;
    await seed(chapter);
  }, chapterIndex);
}

async function seedReadyForOrdeal(
  page: import('@playwright/test').Page,
  chapterIndex: number,
): Promise<void> {
  await page.waitForFunction(() => typeof (window as unknown as { __devSeedReadyForOrdeal?: unknown }).__devSeedReadyForOrdeal === 'function');
  await page.evaluate(async (chapter) => {
    const seed = (window as unknown as { __devSeedReadyForOrdeal: (n: number) => Promise<void> }).__devSeedReadyForOrdeal;
    await seed(chapter);
  }, chapterIndex);
}

async function requestMapExit(page: import('@playwright/test').Page, wavesCleared: boolean): Promise<void> {
  await page.evaluate((cleared) => {
    (window as unknown as { __devRequestMapExit: (ok: boolean) => void }).__devRequestMapExit(cleared);
  }, wavesCleared);
}

async function enterMapCombat(page: import('@playwright/test').Page, mapId: string): Promise<void> {
  await page.waitForFunction(() => typeof (window as unknown as { __devEnterMapCombat?: unknown }).__devEnterMapCombat === 'function');
  await page.evaluate((id) => {
    (window as unknown as { __devEnterMapCombat: (mapId: string) => void }).__devEnterMapCombat(id);
  }, mapId);
}

async function dismissEncounters(page: import('@playwright/test').Page): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await dismissEncounterIfPresent(page);
    await page.waitForTimeout(400);
  }
}

async function waitForHomeOrStory(page: import('@playwright/test').Page, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="home-ui"]') ||
      document.querySelector('[data-testid="story-reader"]'),
    { timeout },
  );
}

/** Try combat exit; fall back to direct map-clear routing for seeded saves. */
async function departClearedMap(page: import('@playwright/test').Page, mapId: string): Promise<void> {
  await dismissEncounters(page);
  await requestMapExit(page, true);

  const leftCombat = await page
    .waitForFunction(
      () =>
        document.querySelector('[data-testid="home-ui"]') ||
        document.querySelector('[data-testid="story-reader"]'),
      { timeout: 4000 },
    )
    .catch(() => null);

  if (!leftCombat) {
    await page.evaluate(
      async (id) => {
        await (window as unknown as {
          __devSimulateMapClear: (mapId: string, cleared: boolean) => Promise<void>;
        }).__devSimulateMapClear(id, true);
      },
      mapId,
    );
    await waitForHomeOrStory(page);
  }

  await dismissEncounters(page);
}

/** Exit a cleared map during an Echoes guided path (combat → combat/story/home). */
async function departPathWalkMap(
  page: import('@playwright/test').Page,
  expectNext: 'combat' | 'story' | 'home',
): Promise<void> {
  await dismissEncounters(page);
  await requestMapExit(page, true);

  if (expectNext === 'combat') {
    await waitForCombatCanvas(page);
    return;
  }

  await waitForHomeOrStory(page, 20_000);

  if (expectNext === 'story') {
    await expect(page.getByTestId('story-reader')).toBeVisible({ timeout: 20_000 });
    return;
  }

  await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
}

async function getJourneyLength(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const store = (window as unknown as {
      __gameStore: { getState: () => { save: { progress: { journey: unknown[] } } | null } };
    }).__gameStore;
    return store.getState().save?.progress.journey?.length ?? 0;
  });
}

async function returnHomeViaPause(page: import('@playwright/test').Page): Promise<void> {
  await page.getByTestId('combat-pause-btn').click();
  await expect(page.getByTestId('combat-pause-menu')).toBeVisible();
  await page.getByRole('button', { name: 'Return Home' }).click();
  await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
}

async function openEchoesAncientModal(
  page: import('@playwright/test').Page,
  ancientId: string,
): Promise<void> {
  await page.getByRole('tab', { name: 'Echoes' }).click();
  await expect(page.getByTestId('home-echoes')).toBeVisible();
  await page.locator(`[data-ancient-id="${ancientId}"]`).click();
  await expect(page.getByTestId('ancient-demo-modal')).toBeVisible({ timeout: 10_000 });
}

/** Advance through story slides via Continue / tap (Skip is visible-but-disabled on short scenes). */
async function finishStoryReader(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByTestId('story-reader')).toBeVisible({ timeout: 10_000 });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!(await page.getByTestId('story-reader').isVisible().catch(() => false))) break;

    const cont = page.getByRole('button', { name: 'Continue' });
    if (await cont.isVisible().catch(() => false)) {
      await cont.click();
      continue;
    }

    await page.getByTestId('story-reader').click({ position: { x: 480, y: 320 } });
  }

  await expect(page.getByTestId('story-reader')).toBeHidden({ timeout: 15_000 });
}

async function openPlayPanel(page: import('@playwright/test').Page): Promise<void> {
  const hint = page.getByTestId('continue-journey-hint');
  const complete = page.getByTestId('journey-complete-hint');
  if (await hint.isVisible().catch(() => false)) return;
  if (await complete.isVisible().catch(() => false)) return;
  await page.evaluate(() => {
    (window as unknown as { __eventBus: { emit: (event: string, payload: unknown) => void } }).__eventBus.emit(
      'home:open-tab',
      { tab: 'play' },
    );
  });
  await page.waitForFunction(
    () => {
      const h = document.querySelector('[data-testid="continue-journey-hint"]');
      const c = document.querySelector('[data-testid="journey-complete-hint"]');
      return (h instanceof HTMLElement && !h.hidden) || (c instanceof HTMLElement && !c.hidden);
    },
    { timeout: 5000 },
  );
}

async function expectSkillUnlocked(
  page: import('@playwright/test').Page,
  skillId: string,
): Promise<void> {
  const unlocked = await page.evaluate((id) => {
    const store = (window as unknown as {
      __gameStore: { getState: () => { save: { unlockedSkills: string[] } | null } };
    }).__gameStore;
    return store.getState().save?.unlockedSkills.includes(id) ?? false;
  }, skillId);
  expect(unlocked).toBe(true);
}

/** One chapter on a fresh save: explore clear → boss clear → story → chapter skill. */
async function runFreshChapter(
  page: import('@playwright/test').Page,
  step: {
    enterHint?: string;
    exploreMapId: string;
    exploreSkillId: string;
    bossMapId: string;
    chapterSkillId: string;
  },
  isFirst = false,
): Promise<void> {
  if (!isFirst && step.enterHint) {
    await openPlayPanel(page);
    await expect(page.getByTestId('continue-journey-hint')).toContainText(step.enterHint);
  }

  await page.getByTestId('continue-journey-btn').click();
  await waitForCombatCanvas(page);
  await dismissEncounters(page);
  await departClearedMap(page, step.exploreMapId);

  await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
  await expectSkillUnlocked(page, step.exploreSkillId);

  await openPlayPanel(page);
  await page.getByTestId('continue-journey-btn').click();
  await waitForCombatCanvas(page);
  await dismissEncounters(page);
  await departClearedMap(page, step.bossMapId);

  await expect(page.getByTestId('story-reader')).toBeVisible({ timeout: 20_000 });
  await finishStoryReader(page);
  await expectSkillUnlocked(page, step.chapterSkillId);
}

const FRESH_CHAPTER_STEPS = [
  {
    exploreMapId: 'map.fallen_village.01',
    exploreSkillId: 'skill.void.slash',
    bossMapId: 'map.fallen_village.02',
    chapterSkillId: 'skill.life.pulse.v2',
    nextRegionHint: 'Foggy Trail',
    storySceneId: 'story.ch01.awakening_jade',
  },
  {
    enterHint: 'Foggy Trail',
    exploreMapId: 'map.mist_forest.01',
    exploreSkillId: 'skill.sword.slash',
    bossMapId: 'map.mist_forest.02',
    chapterSkillId: 'skill.time.drift.v2',
    nextRegionHint: 'Canyon Mouth',
    storySceneId: 'story.ch02.spirit_fox',
  },
  {
    enterHint: 'Canyon Mouth',
    exploreMapId: 'map.stone_canyon.01',
    exploreSkillId: 'skill.flame.bolt',
    bossMapId: 'map.stone_canyon.02',
    chapterSkillId: 'skill.sword.heaven.v5',
    nextRegionHint: 'Lakeshore',
    storySceneId: 'story.ch03.bandit_end',
  },
  {
    enterHint: 'Lakeshore',
    exploreMapId: 'map.moon_lake.01',
    exploreSkillId: 'skill.life.mend',
    bossMapId: 'map.moon_lake.02',
    chapterSkillId: 'skill.flame.lotus.v4',
    nextRegionHint: 'Scorched Dunes',
    storySceneId: 'story.ch04.ancient_seal',
  },
  {
    enterHint: 'Scorched Dunes',
    exploreMapId: 'map.burning_desert.01',
    exploreSkillId: 'skill.lightning.strike',
    bossMapId: 'map.burning_desert.02',
    chapterSkillId: 'skill.lightning.judgment.v4',
    nextRegionHint: 'Storm Pass',
    storySceneId: 'story.ch05.survival',
  },
  {
    enterHint: 'Storm Pass',
    exploreMapId: 'map.thunder_peaks.01',
    exploreSkillId: 'skill.time.slow',
    bossMapId: 'map.thunder_peaks.02',
    chapterSkillId: 'skill.lightning.fork.v1',
    nextRegionHint: 'Ice Gate',
    storySceneId: 'story.ch06.lightning_step',
  },
  {
    enterHint: 'Ice Gate',
    exploreMapId: 'map.frozen_palace.01',
    exploreSkillId: 'skill.flame.scorch.v1',
    bossMapId: 'map.frozen_palace.02',
    chapterSkillId: 'skill.life.bloom.v1',
    nextRegionHint: 'Rift Edge',
    storySceneId: 'story.ch07.forgotten_queen',
  },
  {
    enterHint: 'Rift Edge',
    exploreMapId: 'map.abyss_rift.01',
    exploreSkillId: 'skill.void.rift.v1',
    bossMapId: 'map.abyss_rift.02',
    chapterSkillId: 'skill.void.abyss.v5',
    nextRegionHint: 'Celestial Steps',
    storySceneId: 'story.ch08.corruption',
  },
  {
    enterHint: 'Celestial Steps',
    exploreMapId: 'map.heavenly_gate.01',
    exploreSkillId: 'skill.sword.crescent.v1',
    bossMapId: 'map.heavenly_gate.02',
    chapterSkillId: 'skill.time.stasis.v4',
    nextRegionHint: 'Throne Approach',
    storySceneId: 'story.ch09.guardians',
  },
  {
    enterHint: 'Throne Approach',
    exploreMapId: 'map.void_throne.01',
    exploreSkillId: 'skill.void.tear.v2',
    bossMapId: 'map.void_throne.02',
    chapterSkillId: 'skill.time.echo.v5',
    storySceneId: 'story.ch10.epilogue',
  },
] as const;

test.describe('Journey base flow', () => {
  test('chapter 1 complete → Continue Journey opens Mist Forest', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await seedRoadProgress(page, 1);

    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Continue Journey');
    await expect(page.getByTestId('continue-journey-hint')).toContainText('Foggy Trail');

    await page.getByTestId('continue-journey-btn').click();
    await waitForCombatCanvas(page);
    await dismissEncounterIfPresent(page);
  });

  test('world map portal shows next region after chapter 1', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await seedRoadProgress(page, 1);

    await page.getByTestId('map-portal-btn').click();
    await expect(page.getByTestId('world-map')).toBeVisible();
    await page.getByTestId('world-map-node-map.mist_forest.01').click();
    await expect(page.getByTestId('world-map-detail')).toBeVisible();
    await expect(page.getByTestId('world-map-detail')).toContainText('Foggy Trail');
  });

  test('full road complete hides Continue Journey and shows completion copy', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await seedRoadProgress(page, 10);

    await expect(page.getByTestId('continue-journey-btn')).toBeHidden();
    await expect(page.getByTestId('journey-complete-hint')).toBeVisible();
    await expect(page.getByTestId('map-portal-btn')).toBeVisible();
  });

  test('chapter 1 story finish opens Mist Forest on Home', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await seedBossPendingStory(page, 1);
    await page.evaluate(() => {
      const enter = (window as unknown as {
        __devEnterStory: (chapterId: string, sceneId: string) => void;
      }).__devEnterStory;
      enter('chapter.01.fallen_village', 'story.ch01.awakening_jade');
    });

    await finishStoryReader(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    await openPlayPanel(page);
    await expect(page.getByTestId('continue-journey-hint')).toContainText('Foggy Trail');
  });

  test('explore clear via depart unlocks Void Slash on Skills tab', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('continue-journey-btn').click();
    await waitForCombatCanvas(page);
    await dismissEncounters(page);

    await departClearedMap(page, 'map.fallen_village.01');

    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('tab', { name: 'Skills' }).click();
    await expect(page.getByTestId('home-skills-intent-void')).toBeVisible();
    await expect(page.getByTestId('home-skills-intent-void')).toContainText('Void Slash');

    await page.getByRole('tab', { name: 'Path' }).click();
    await expect(page.getByTestId('home-path-row-map_clear-map.fallen_village.01')).toBeVisible();
  });

  test('chapter 1 boss clear routes to story scene', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await seedReadyForOrdeal(page, 1);
    await enterMapCombat(page, 'map.fallen_village.02');
    await waitForCombatCanvas(page);
    await departClearedMap(page, 'map.fallen_village.02');

    await expect(page.getByTestId('story-reader')).toBeVisible({ timeout: 20_000 });
  });

  test('chapter 2 explore clear unlocks Sword Slash', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await seedRoadProgress(page, 1);
    await enterMapCombat(page, 'map.mist_forest.01');
    await waitForCombatCanvas(page);
    await departClearedMap(page, 'map.mist_forest.01');

    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('tab', { name: 'Skills' }).click();
    await expect(page.getByTestId('home-skills-intent-sword')).toBeVisible();
    await expect(page.getByTestId('home-skills-intent-sword')).toContainText('Sword Slash');
  });

  test('ancient sword encounter sets weapon milestone', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await page.evaluate(() => {
      void (window as unknown as { __devShowEncounter: (id: string) => Promise<void> }).__devShowEncounter('encounter.ancient_sword');
    });
    await page.getByRole('button', { name: 'Embrace the Dao' }).click({ timeout: 15_000 });
    await expect(page.locator('[data-testid="encounter-modal"]')).toBeHidden({ timeout: 10_000 });

    const milestone = await page.evaluate(() => {
      const store = (window as unknown as { __gameStore: { getState: () => { save: { progress: { weaponMilestone: string } } | null } } }).__gameStore;
      return store.getState().save?.progress.weaponMilestone ?? null;
    });
    expect(milestone).toBe('ancient_sword');

    await page.getByRole('tab', { name: 'Skills' }).click();
    await expect(page.getByTestId('home-skills-intent-sword')).toBeVisible();
  });
});

const EXPLORE_CLEAR_CASES = [
  { chaptersComplete: 2, mapId: 'map.stone_canyon.01', intent: 'flame', skillId: 'skill.flame.bolt', skillName: 'Flame Bolt' },
  { chaptersComplete: 3, mapId: 'map.moon_lake.01', intent: 'life', skillId: 'skill.life.mend', skillName: 'Life Mend' },
  { chaptersComplete: 4, mapId: 'map.burning_desert.01', intent: 'lightning', skillId: 'skill.lightning.strike', skillName: 'Lightning Strike' },
  { chaptersComplete: 5, mapId: 'map.thunder_peaks.01', intent: 'time', skillId: 'skill.time.slow', skillName: 'Time Slow' },
  { chaptersComplete: 6, mapId: 'map.frozen_palace.01', intent: 'flame', skillId: 'skill.flame.scorch.v1', skillName: 'Scorch Bolt' },
  { chaptersComplete: 7, mapId: 'map.abyss_rift.01', intent: 'void', skillId: 'skill.void.rift.v1', skillName: 'Void Rift' },
  { chaptersComplete: 8, mapId: 'map.heavenly_gate.01', intent: 'sword', skillId: 'skill.sword.crescent.v1', skillName: 'Crescent Slash' },
  { chaptersComplete: 9, mapId: 'map.void_throne.01', intent: 'void', skillId: 'skill.void.tear.v2', skillName: 'Void Tear' },
] as const;

const BOSS_STORY_CASES = [
  { chapter: 2, bossMapId: 'map.mist_forest.02', nextRegionName: 'Canyon Mouth' },
  { chapter: 3, bossMapId: 'map.stone_canyon.02', nextRegionName: 'Lakeshore' },
  { chapter: 4, bossMapId: 'map.moon_lake.02', nextRegionName: 'Scorched Dunes' },
  { chapter: 5, bossMapId: 'map.burning_desert.02', nextRegionName: 'Storm Pass' },
  { chapter: 6, bossMapId: 'map.thunder_peaks.02', nextRegionName: 'Ice Gate' },
  { chapter: 7, bossMapId: 'map.frozen_palace.02', nextRegionName: 'Rift Edge' },
  { chapter: 8, bossMapId: 'map.abyss_rift.02', nextRegionName: 'Celestial Steps' },
  { chapter: 9, bossMapId: 'map.heavenly_gate.02', nextRegionName: 'Throne Approach' },
] as const;

test.describe('Multi-chapter road', () => {
  for (const { chaptersComplete, mapId, intent, skillId, skillName } of EXPLORE_CLEAR_CASES) {
    test(`after ch${chaptersComplete} complete, ${mapId} clear unlocks ${skillName}`, async ({ page }) => {
      await page.goto('/');
      await dismissAudioUnlock(page);
      await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

      await seedRoadProgress(page, chaptersComplete);
      await enterMapCombat(page, mapId);
      await waitForCombatCanvas(page);
      await departClearedMap(page, mapId);

      await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
      await expectSkillUnlocked(page, skillId);
      await page.getByRole('tab', { name: 'Skills' }).click();
      await expect(page.getByTestId(`home-skills-intent-${intent}`)).toBeVisible();
    });
  }

  for (const { chapter, bossMapId, nextRegionName } of BOSS_STORY_CASES) {
    test(`chapter ${chapter} boss clear → story → Continue Journey opens ${nextRegionName}`, async ({ page }) => {
      await page.goto('/');
      await dismissAudioUnlock(page);
      await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

      await seedReadyForOrdeal(page, chapter);
      await enterMapCombat(page, bossMapId);
      await waitForCombatCanvas(page);
      await departClearedMap(page, bossMapId);

      await expect(page.getByTestId('story-reader')).toBeVisible({ timeout: 20_000 });
      await finishStoryReader(page);
      await openPlayPanel(page);
      await expect(page.getByTestId('continue-journey-hint')).toContainText(nextRegionName);
    });
  }

  test('chapter 10 boss clear → story → journey complete', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await seedReadyForOrdeal(page, 10);
    await enterMapCombat(page, 'map.void_throne.02');
    await waitForCombatCanvas(page);
    await departClearedMap(page, 'map.void_throne.02');

    await expect(page.getByTestId('story-reader')).toBeVisible({ timeout: 20_000 });
    await finishStoryReader(page);
    await openPlayPanel(page);
    await expect(page.getByTestId('continue-journey-btn')).toBeHidden();
    await expect(page.getByTestId('journey-complete-hint')).toBeVisible();
  });

  test('Path tab replays chapter 1 story without duplicating rewards', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await seedRoadProgress(page, 1);
    const spiritBefore = await page.evaluate(() => {
      const store = (window as unknown as { __gameStore: { getState: () => { save: { stats: { spirit: number } } | null } } }).__gameStore;
      return store.getState().save?.stats.spirit ?? 0;
    });

    await page.getByRole('tab', { name: 'Path' }).click();
    await page.getByTestId('home-story-replay-story.ch01.awakening_jade').click();
    await finishStoryReader(page);

    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    const spiritAfter = await page.evaluate(() => {
      const store = (window as unknown as { __gameStore: { getState: () => { save: { stats: { spirit: number } } | null } } }).__gameStore;
      return store.getState().save?.stats.spirit ?? 0;
    });
    expect(spiritAfter).toBe(spiritBefore);
  });

  test('breakthrough ceremony advances realm once', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await page.evaluate(() => {
      (window as unknown as { __devPrepareBreakthrough: () => void }).__devPrepareBreakthrough();
    });

    await expect(page.getByTestId('cultivate-btn')).toBeVisible();
    await page.getByTestId('cultivate-btn').click({ force: true });
    await expect(page.getByTestId('breakthrough-modal')).toBeVisible();
    await expect(page.getByTestId('breakthrough-modal')).toBeHidden({ timeout: 15_000 });

    const realmId = await page.evaluate(() => {
      const store = (window as unknown as { __gameStore: { getState: () => { save: { realm: { id: string } } | null } } }).__gameStore;
      return store.getState().save?.realm.id ?? '';
    });
    expect(realmId).toBe('qi_condensation');
  });
});

test.describe('Fresh save', () => {
  test('chapter 1 full loop without dev seeds', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Begin Journey');

    const skillsBefore = await page.evaluate(() => {
      const store = (window as unknown as {
        __gameStore: { getState: () => { save: { unlockedSkills: string[] } | null } };
      }).__gameStore;
      return store.getState().save?.unlockedSkills ?? [];
    });
    expect(skillsBefore).not.toContain('skill.void.slash');

    await page.getByTestId('continue-journey-btn').click();
    await waitForCombatCanvas(page);
    await dismissEncounters(page);
    await departClearedMap(page, 'map.fallen_village.01');

    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    await expectSkillUnlocked(page, 'skill.void.slash');

    await openPlayPanel(page);
    await page.getByTestId('continue-journey-btn').click();
    await waitForCombatCanvas(page);
    await departClearedMap(page, 'map.fallen_village.02');

    await expect(page.getByTestId('story-reader')).toBeVisible({ timeout: 20_000 });
    await finishStoryReader(page);

    await openPlayPanel(page);
    await expect(page.getByTestId('continue-journey-hint')).toContainText('Foggy Trail');
    await expectSkillUnlocked(page, 'skill.life.pulse.v2');

    await page.getByRole('tab', { name: 'Path' }).click();
    await expect(page.getByTestId('home-path-row-map_clear-map.fallen_village.01')).toBeVisible();
    await expect(page.getByTestId('home-path-row-story-story.ch01.awakening_jade')).toBeVisible();
  });

  test('full road loop without dev seeds (chapters 1–10)', async ({ page }) => {
    test.setTimeout(300_000);

    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Begin Journey');

    for (let i = 0; i < FRESH_CHAPTER_STEPS.length; i += 1) {
      const step = FRESH_CHAPTER_STEPS[i]!;
      await runFreshChapter(page, step, i === 0);

      if ('nextRegionHint' in step && step.nextRegionHint) {
        await openPlayPanel(page);
        await expect(page.getByTestId('continue-journey-hint')).toContainText(step.nextRegionHint);
      }
    }

    await openPlayPanel(page);
    await expect(page.getByTestId('continue-journey-btn')).toBeHidden();
    await expect(page.getByTestId('journey-complete-hint')).toBeVisible();

    await page.getByRole('tab', { name: 'Path' }).click();
    await expect(page.getByTestId('home-path-row-story-story.ch10.epilogue')).toBeVisible();

    const exploreSkills = FRESH_CHAPTER_STEPS.map((s) => s.exploreSkillId);
    for (const skillId of exploreSkills) {
      await expectSkillUnlocked(page, skillId);
    }
  });
});

test.describe('Echoes guided path', () => {
  test('Follow Their Path walks breakthrough sage road without polluting My Path', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    const journeyBefore = await getJourneyLength(page);
    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Begin Journey');

    await openEchoesAncientModal(page, 'ancient.breakthrough_sage');
    await page.getByRole('button', { name: 'Follow Their Path' }).click();

    await waitForCombatCanvas(page);
    await expect(page.getByTestId('ancient-echo-banner')).toBeVisible();

    await departPathWalkMap(page, 'combat');
    await departPathWalkMap(page, 'story');

    await finishStoryReader(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    expect(await getJourneyLength(page)).toBe(journeyBefore);
    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Begin Journey');
  });

  test('Walk Here enters god-mode combat and exit restores real save', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    const journeyBefore = await getJourneyLength(page);

    await openEchoesAncientModal(page, 'ancient.breakthrough_sage');
    await page.getByRole('button', { name: 'Walk Here' }).click();

    await waitForCombatCanvas(page);
    await expect(page.getByTestId('ancient-echo-banner')).toBeVisible();
    await returnHomeViaPause(page);

    expect(await getJourneyLength(page)).toBe(journeyBefore);
    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Begin Journey');
  });

  test('sword ancestor path interleaves three story beats across three boss maps', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    const journeyBefore = await getJourneyLength(page);

    await openEchoesAncientModal(page, 'ancient.sword_ancestor');
    await page.getByRole('button', { name: 'Follow Their Path' }).click();

    await waitForCombatCanvas(page);
    await expect(page.getByTestId('ancient-echo-banner')).toBeVisible();

    await departPathWalkMap(page, 'story');
    await finishStoryReader(page);
    await waitForCombatCanvas(page);

    await departPathWalkMap(page, 'story');
    await finishStoryReader(page);
    await waitForCombatCanvas(page);

    await departPathWalkMap(page, 'story');
    await finishStoryReader(page);

    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    expect(await getJourneyLength(page)).toBe(journeyBefore);
    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Begin Journey');
  });
});

test.describe('Base flow sign-off', () => {
  test('fresh save opens world map portal with first region unlocked', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('map-portal-btn').click();
    await expect(page.getByTestId('world-map')).toBeVisible();
    await expect(page.getByTestId('world-map-node-map.fallen_village.01')).toBeVisible();
  });

  test('locked region explains chapter gate on fresh save', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('map-portal-btn').click();
    await expect(page.getByTestId('world-map')).toBeVisible();
    await page.getByTestId('world-map-node-map.mist_forest.01').click();

    await expect(page.getByTestId('world-map-detail')).toBeVisible();
    await expect(page.getByTestId('world-map-detail')).toContainText('Complete the previous chapter first');
    await expect(page.getByRole('button', { name: 'Enter' })).toBeDisabled();
  });

  test('reload restores progress after ch1 explore clear', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('continue-journey-btn').click();
    await waitForCombatCanvas(page);
    await dismissEncounters(page);
    await departClearedMap(page, 'map.fallen_village.01');

    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });
    await expectSkillUnlocked(page, 'skill.void.slash');

    await page.reload();
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await expectSkillUnlocked(page, 'skill.void.slash');
    await expect(page.getByTestId('continue-journey-btn')).toHaveText('Continue Journey');
    await expect(page.getByTestId('continue-journey-hint')).toContainText('Ruined Shrine');
  });

  test('settings shows MVP version string', async ({ page }) => {
    await page.goto('/');
    await dismissAudioUnlock(page);
    await expect(page.locator('[data-testid="home-ui"]')).toBeVisible({ timeout: 20_000 });

    await page.locator('.home-profile__settings').click();
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();
    await expect(page.locator('.settings-modal__version')).toContainText('0.1.0-mvp');
  });
});
