#!/usr/bin/env node
/**
 * Batch-generate fortuitous encounter card art via OpenRouter.
 * Requires OPENROUTER_API_KEY (or OPENAI_API_KEY is NOT used — OpenRouter only).
 *
 * Usage:
 *   node tools/generate-encounter-art.mjs              # all encounters
 *   node tools/generate-encounter-art.mjs spirit_beast  # one slug
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets/encounters');

const STYLE =
  'Xianxia cultivation fantasy mobile game card art. Painterly digital illustration, ' +
  'dark moody background, teal (#2dd4a8) and gold (#c9a227) accent lighting, ' +
  'readable at small size, no text, no UI, square composition, cinematic.';

/** slug → image prompt */
const ENCOUNTERS = {
  spirit_beast: `${STYLE} Ethereal white spirit fox with glowing jade eyes emerging from misty forest shadows, mystical orange and violet aura, companion beast.`,
  ancient_sword: `${STYLE} Legendary ancient spirit sword half-buried in cracked stone altar, pale blue qi radiance, sealed blade awakening.`,
  hidden_cave: `${STYLE} Hidden cultivation cave interior, crystal veins glittering in darkness, gold and teal mineral glow, treasure grotto.`,
  ancient_inheritance: `${STYLE} Ghostly silhouette of an ancient cultivator transferring golden meridian energy into a mortal silhouette, void background, inheritance ritual.`,
  forgotten_memory: `${STYLE} Haunting vision of a ruined village consumed by purple void corruption, melancholic memory fragment, distant silhouettes.`,
  secret_manual: `${STYLE} Ancient flame cultivation manual scroll unfurling with ember sparks and crimson qi, secret technique pages, fire dao.`,
};

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error('Set OPENROUTER_API_KEY to generate encounter art.');
  process.exit(1);
}

async function generateOne(slug, prompt) {
  const outPath = path.join(OUT_DIR, `${slug}.png`);
  console.log(`Generating ${slug}…`);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image',
      messages: [{ role: 'user', content: prompt }],
      modalities: ['image', 'text'],
      image_config: { aspect_ratio: '1:1', image_size: '1K' },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  const url = message?.images?.[0]?.image_url?.url ?? message?.image_url?.url;
  if (!url?.startsWith('data:')) {
    throw new Error(`No image for ${slug}: ${JSON.stringify(data).slice(0, 300)}`);
  }

  const base64 = url.replace(/^data:image\/\w+;base64,/, '');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
  console.log(`  → ${outPath}`);
  return outPath;
}

const filter = process.argv[2];
const entries = Object.entries(ENCOUNTERS).filter(([slug]) => !filter || slug === filter);

if (filter && entries.length === 0) {
  console.error(`Unknown slug "${filter}". Options: ${Object.keys(ENCOUNTERS).join(', ')}`);
  process.exit(1);
}

for (const [slug, prompt] of entries) {
  await generateOne(slug, prompt);
}

console.log('Done. Update content/encounters/fortuitous/*.json illustration paths if needed.');
