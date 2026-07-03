export interface ContentIssue {
  file: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationReport {
  checked: Record<string, number>;
  errors: ContentIssue[];
  warnings: ContentIssue[];
}

export function createReport(): ValidationReport {
  return { checked: {}, errors: [], warnings: [] };
}

export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  for (const [type, count] of Object.entries(report.checked).sort(([a], [b]) => a.localeCompare(b))) {
    const mark = report.errors.some((e) => e.file.startsWith(type)) ? '✗' : '✓';
    lines.push(`${mark} ${type} (${count} files)`);
  }

  for (const issue of report.errors) {
    lines.push(`✗ ${issue.file} — ${issue.message}`);
  }
  for (const issue of report.warnings) {
    lines.push(`⚠ ${issue.file} — ${issue.message}`);
  }

  const summary = `Summary: ${report.errors.length} error(s), ${report.warnings.length} warning(s)`;
  lines.push(summary);
  return lines.join('\n');
}
