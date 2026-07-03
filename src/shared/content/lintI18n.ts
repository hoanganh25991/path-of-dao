import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidationReport } from '@/shared/content/types';
import { createReport } from '@/shared/content/types';

export type LocaleCode = 'en' | 'vi';

const CONTENT = join(process.cwd(), 'content', 'locales');

function loadMergedLocale(locale: LocaleCode): Record<string, string> {
  const dir = join(CONTENT, locale);
  if (!existsSync(dir)) return {};
  const merged: Record<string, string> = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    Object.assign(merged, JSON.parse(readFileSync(join(dir, file), 'utf8')));
  }
  return merged;
}

export interface LintI18nOptions {
  /** Treat vi gaps as errors (strict ship mode). */
  strict?: boolean;
}

/** Key parity + empty value lint across en/vi locale shards (sub-plan 24). */
export function lintI18n(options: LintI18nOptions = {}): ValidationReport {
  const report = createReport();
  const en = loadMergedLocale('en');
  const vi = loadMergedLocale('vi');

  report.checked.en = Object.keys(en).length;
  report.checked.vi = Object.keys(vi).length;

  for (const key of Object.keys(en).sort()) {
    if (!(key in vi)) {
      const issue = {
        file: 'content/locales/vi',
        message: `missing vi key "${key}"`,
        severity: 'warning' as const,
      };
      if (options.strict) report.errors.push({ ...issue, severity: 'error' });
      else report.warnings.push(issue);
    } else if (vi[key]!.trim() === '') {
      report.errors.push({
        file: 'content/locales/vi',
        message: `empty vi value for "${key}"`,
        severity: 'error',
      });
    }
  }

  for (const key of Object.keys(vi)) {
    if (!(key in en)) {
      report.errors.push({
        file: 'content/locales/en',
        message: `orphan vi key "${key}" (missing in en)`,
        severity: 'error',
      });
    }
    if (en[key]?.trim() === '') {
      report.errors.push({
        file: 'content/locales/en',
        message: `empty en value for "${key}"`,
        severity: 'error',
      });
    }
  }

  return report;
}
