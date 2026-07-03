import tablesJson from '../../content/encounters/fortuitous/_tables.json';
import {
  encounterDefinitionSchema,
  encounterTablesSchema,
  type EncounterDefinition,
  type EncounterTables,
  type EncounterTriggerKind,
} from '@/shared/schemas/fortuitous-encounters';

const encounterModules = import.meta.glob('../../content/encounters/fortuitous/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const encounterArtUrls = import.meta.glob('../../assets/encounters/*.{png,webp,jpg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function resolveEncounterIllustration(illustration?: string): string | undefined {
  if (!illustration) return undefined;
  const fileName = illustration.replace(/^.*\//, '');
  const entry = Object.entries(encounterArtUrls).find(([path]) => path.endsWith(`/${fileName}`));
  return entry?.[1];
}

const tablesData = encounterTablesSchema.parse(tablesJson);
const encounterCache = new Map<string, EncounterDefinition>();
const byTrigger = new Map<EncounterTriggerKind, EncounterDefinition[]>();

function buildEncounterIndex(): Map<string, unknown> {
  const index = new Map<string, unknown>();
  for (const [path, raw] of Object.entries(encounterModules)) {
    const fileName = path.replace(/^.*\//, '').replace(/\.json$/, '');
    if (fileName.startsWith('_')) continue;
    index.set(fileName, raw);
  }
  return index;
}

const rawEncounters = buildEncounterIndex();

function cacheEncounter(def: EncounterDefinition): void {
  encounterCache.set(def.id, def);
  const list = byTrigger.get(def.trigger) ?? [];
  list.push(def);
  byTrigger.set(def.trigger, list);
}

for (const [fileName, raw] of rawEncounters.entries()) {
  const result = encounterDefinitionSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`EncounterLoader: invalid "${fileName}": ${result.error.message}`);
  }
  if (result.data.id !== fileName) {
    throw new Error(
      `EncounterLoader: "${fileName}" declares mismatched id "${result.data.id}"`,
    );
  }
  const resolved = resolveEncounterIllustration(result.data.illustration);
  cacheEncounter({
    ...result.data,
    illustration: resolved ?? result.data.illustration,
  });
}

export function getEncounterTables(): EncounterTables {
  return tablesData;
}

export function listEncounterIds(): string[] {
  return [...encounterCache.keys()].sort();
}

export function getEncounterDefinition(encounterId: string): EncounterDefinition {
  const def = encounterCache.get(encounterId);
  if (!def) {
    throw new Error(`EncounterLoader: no encounter "${encounterId}"`);
  }
  return def;
}

export function getEncountersForTrigger(trigger: EncounterTriggerKind): EncounterDefinition[] {
  return [...(byTrigger.get(trigger) ?? [])];
}
