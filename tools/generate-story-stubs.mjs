#!/usr/bin/env node
/** Generate stub story scene JSON for chapters 1–10. Run: node tools/generate-story-stubs.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chapters = JSON.parse(readFileSync(join(root, 'content/chapters/index.json'), 'utf8')).chapters;
const outDir = join(root, 'content/story');

for (const ch of chapters) {
  const num = ch.id.match(/chapter\.(\d+)/)?.[1] ?? '00';
  const scene = {
    id: ch.storySceneId,
    chapterId: ch.id,
    slides: [
      {
        illustration: null,
        textKey: `story.ch${num}.slide01`,
        durationMs: 0,
      },
      {
        illustration: null,
        textKey: `story.ch${num}.slide02`,
        durationMs: 0,
      },
    ],
    rewards: [
      { type: 'spirit', amount: 20 + Number(num) * 5 },
      { type: 'gold', amount: 50 + Number(num) * 10 },
    ],
    unlockChapter: ch.unlockChapter,
  };
  writeFileSync(join(outDir, `${ch.storySceneId}.json`), `${JSON.stringify(scene, null, 2)}\n`);
}

console.log(`Wrote ${chapters.length} story stubs to content/story/`);
