import { loadContentIndex, validateSchemas } from '@/shared/content/validateSchemas';
import { lintCrossrefs, mergeReports } from '@/shared/content/lintCrossrefs';
import type { ValidationReport } from '@/shared/content/types';

export interface ValidateAllOptions {
  strictI18n?: boolean;
}

export function validateAllContent(options: ValidateAllOptions = {}): ValidationReport {
  const index = loadContentIndex();
  const schemaReport = validateSchemas(index);
  const xrefReport = lintCrossrefs(index, { strictI18n: options.strictI18n });
  return mergeReports(schemaReport, xrefReport);
}
