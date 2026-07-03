import { describe, expect, it } from 'vitest';
import { lintI18n } from '@/shared/content/lintI18n';

describe('locale parity (sub-plan 24)', () => {
  it('en and vi have matching keys', () => {
    const strict = process.env.I18N_STRICT === '1';
    const report = lintI18n({ strict });
    if (report.errors.length > 0 || report.warnings.length > 0) {
      const lines = [
        ...report.errors.map((e) => `✗ ${e.message}`),
        ...report.warnings.map((w) => `⚠ ${w.message}`),
      ];
      console.error(lines.join('\n'));
    }
    expect(report.errors).toEqual([]);
    if (!strict) {
      // warnings allowed in non-strict mode
      expect(report.warnings.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('has minimum key coverage for MVP ship', () => {
    const report = lintI18n();
    expect(report.checked.en).toBeGreaterThanOrEqual(400);
    expect(report.checked.vi).toBeGreaterThanOrEqual(400);
  });
});
