#!/usr/bin/env node
/** Locale parity linter — sub-plan 24. Usage: pnpm i18n:lint [--strict] */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
if (process.argv.includes('--strict')) {
  process.env.I18N_STRICT = '1';
}

const result = spawnSync('npx', ['vitest', 'run', 'tests/content/locale-parity.test.ts'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
