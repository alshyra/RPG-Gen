/**
 * Script to import spells from markdown format to JSON seed data
 *
 * Usage: npm run import:spells
 *
 * Reads from: packages/backend/src/seed/Options Barde level 1 - Sorts de niveau.md
 * Writes to: packages/backend/src/seed/spells.json
 *
 * The script parses tab-separated markdown lines into structured spell definitions
 * with all necessary combat and casting information.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SpellDefinition {
  definitionId?: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  ritual: boolean;
  description: string;
  meta: {
    damageDice?: string;
    damageType?: string;
    saveType?: string;
    attackType?: 'melee' | 'ranged' | 'spell';
    school?: string;
    areaOfEffect?: string;
    scaling?: string;
  };
}

// Create a URL-friendly slug (remove accents, lower-case, replace spaces/non-alphanum with hyphens)
function slugify(input: string): string {
  return input
    .normalize('NFD') // split accented letters
    .replace(/\p{Diacritic}/gu, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non alphanumeric with '-'
    .replace(/(^-|-$)/g, ''); // trim leading/trailing hyphens
}

// Map French spell schools to English for consistency
const SCHOOL_MAP: Record<string, string> = {
  enchantement: 'enchantment',
  évocation: 'evocation',
  divination: 'divination',
  transmutation: 'transmutation',
  illusion: 'illusion',
  abjuration: 'abjuration',
  invocation: 'conjuration',
};

// Extract damage dice from description (pattern: 1d4, 2d8, etc.)
function extractDamageDice(description: string): string | undefined {
  if (!description) return undefined;
  const match = description.match(/(\d+d\d+)/);
  return match ? match[1] : undefined;
}

// Extract damage type from description
function extractDamageType(description: string): string | undefined {
  if (!description) return undefined;
  const damageTypes = [
    'psychiques',
    'tonnerre',
    'feu',
    'froid',
    'acide',
    'poison',
    'radieux',
    'nécrotique',
    'force',
    'contondants',
    'tranchants',
    'perforants',
  ];

  const descLower = description.toLowerCase();
  const found = damageTypes.find(type => descLower.includes(type));
  return found;
}

// Extract save type from description (JdS de Sag., JdS de Con., etc.)
function extractSaveType(description: string): string | undefined {
  if (!description) return undefined;
  const saveMatch = description.match(/JdS de (Sag\.|Con\.|Dex\.|For\.|Int\.|Cha\.)/);
  if (!saveMatch) return undefined;

  const saveMap: Record<string, string> = {
    'Sag.': 'wisdom',
    'Con.': 'constitution',
    'Dex.': 'dexterity',
    'For.': 'strength',
    'Int.': 'intelligence',
    'Cha.': 'charisma',
  };

  return saveMap[saveMatch[1]] || undefined;
}

// Extract area of effect from description
function extractAreaOfEffect(description: string): string | undefined {
  if (!description) return undefined;
  const areaMatch = description.match(/(rayon|cube|cône) de (\d+[,.]?\d*\s*m)/);
  return areaMatch ? `${areaMatch[1]} ${areaMatch[2]}` : undefined;
}

// Extract scaling info (how spell scales with higher levels)
function extractScaling(description: string): string | undefined {
  if (!description) return undefined;
  const scalingMatch = description.match(/\(([^)]*(?:niv|niveau|dégâts)[^)]*)\)/);
  return scalingMatch ? scalingMatch[1] : undefined;
}

function getAttackType(
  saveType: string | undefined,
  damageDice: string | undefined,
): 'melee' | 'ranged' | 'spell' | undefined {
  if (saveType) return 'spell';
  if (damageDice) return 'spell';
  return undefined;
}

function parseSpellLine(line: string): SpellDefinition | null {
  // Split by tabs (the MD file is tab-separated)
  // Keep empty parts: some lines use empty columns (multiple consecutive tabs)
  // so we *don't* filter out empty strings here. We will normalize/trim and
  // pad the array so destructuring works even when some optional fields are
  // missing (e.g. duration, ritual). This prevents valid lines like
  // "Zone de vérité\t2\tenchantement\t...\tV,S\t\t\tDescription" from
  // being skipped.
  const rawParts = line.split('\t');
  const parts = rawParts.map(p => p.trim());

  // Ensure we always have at least 9 elements to destructure safely (name, level, school,
  // castingTime, range, components, duration, ritual, description). Fill with empty
  // strings when columns are missing.
  while (parts.length < 9) parts.push('');

  if (parts.length < 8) return null; // Not enough data

  const [name, levelStr, school, castingTime, range, components, duration, ritual, description] =
    parts;

  // Skip header lines or empty lines
  if (!name || name === 'Name' || !levelStr.match(/^\d+$/)) return null;

  const level = parseInt(levelStr, 10);
  const isRitual = ritual?.toLowerCase() === 'rituel';

  const damageDice = extractDamageDice(description),
    damageType = extractDamageType(description),
    saveType = extractSaveType(description),
    areaOfEffect = extractAreaOfEffect(description),
    scaling = extractScaling(description);

  const attackType = getAttackType(saveType, damageDice);

  return {
    name,
    level,
    school: SCHOOL_MAP[school.toLowerCase()] || school,
    castingTime,
    range,
    components,
    duration: duration || 'instantaneous',
    ritual: isRitual,
    description,
    meta: {
      ...(damageDice && { damageDice }),
      ...(damageType && { damageType }),
      ...(saveType && { saveType }),
      ...(attackType && { attackType }),
      school: SCHOOL_MAP[school.toLowerCase()] || school,
      ...(areaOfEffect && { areaOfEffect }),
      ...(scaling && { scaling }),
    },
  };
}

function main() {
  // Default input is the seed file in this folder. You can replace this with any
  // other markdown/TSV file exported from aidedd.org.
  const inputPath = join(__dirname, '../seed/spells.md');
  const outputPath = join(__dirname, '../seed/spells.json');

  console.log('Reading spell data from:', inputPath);

  const content = readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');

  const spells: SpellDefinition[] = lines
    .map(parseSpellLine)
    .filter((s): s is SpellDefinition => s !== null && s !== undefined);

  // Generate unique definitionId for each spell similar to item 'definitionId'
  const counters = new Map<string, number>();
  spells.forEach(s => {
    const base = `spell-${s.level}-${slugify(s.name)}`;
    const count = counters.get(base) ?? 0;
    counters.set(base, count + 1);
    s.definitionId = count === 0 ? base : `${base}-${count + 1}`;
  });

  console.log(`Parsed ${spells.length} spells`);

  // Sort by level then name
  spells.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name);
  });

  writeFileSync(outputPath, JSON.stringify(spells, null, 2), 'utf-8');
  console.log(`✓ Spell data written to: ${outputPath}`);

  const byLevel = spells.reduce(
    (acc, spell) => {
      acc[spell.level] = (acc[spell.level] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  Object.entries(byLevel)
    .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
    .forEach(([level, count]) => console.log(`  Level ${level}: ${count} spells`));
}

main();
