#!/usr/bin/env node
/**
 * Master content validator CLI (sub-plan 20).
 * Usage: node tools/content/validate-all.mjs [--strict-i18n]
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const strict = process.argv.includes('--strict-i18n');
const args = ['vitest', 'run', 'tests/content/validate-all.test.ts'];
if (strict) {
  process.env.CONTENT_STRICT_I18N = '1';
}

const result = spawnSync('npx', args, { cwd: root, stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
