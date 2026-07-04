#!/usr/bin/env node
/**
 * @deprecated Do not use — this script tiled 50×38 chunks via modulo, creating
 * visible repeating grid lines and interior "walls" that broke exploration.
 *
 * Use instead:
 *   node tools/regenerate-chapter-maps.mjs
 *   node tools/generate-star-fallen-village.mjs
 */
console.error(
  'expand-tilemap.mjs is deprecated. Run: node tools/regenerate-chapter-maps.mjs',
);
process.exit(1);
