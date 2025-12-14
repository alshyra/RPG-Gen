import test from 'ava';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Calculate base directory: test/integration/...test.ts -> src/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDir = join(__dirname, '..', '..');
test('All 12 D&D 5e class files exist and are valid JSON', async t => {
  const classes = [
    'barbarian',
    'bard',
    'cleric',
    'druid',
    'fighter',
    'monk',
    'paladin',
    'ranger',
    'rogue',
    'sorcerer',
    'warlock',
    'wizard',
  ];

  const results = classes.map(className => {
    const filePath = join(baseDir, 'src', 'seed', 'classes', className, 'levels.json');
    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      return {
        className,
        exists: true,
        valid: true,
        hasClassName: data.className !== undefined,
        hasLevels: Array.isArray(data.levels),
        levelCount: data.levels ? data.levels.length : 0,
      };
    } catch (err) {
      return {
        className,
        exists: false,
        valid: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  // All classes should exist and be valid
  results.forEach(result => {
    if (!result.valid) {
      t.fail(`${result.className}: ${(result as any).error}`);
    }
  });

  // Count successful loads
  const validCount = results.filter(r => r.valid).length;
  t.is(validCount, 12, `All 12 classes should have valid levels.json files`);

  // Sample checks
  const barbarianResult = results.find(r => r.className === 'barbarian');
  t.true(barbarianResult?.valid, 'Barbarian should be valid');
  t.true(barbarianResult?.hasLevels, 'Barbarian should have levels array');
  t.is(barbarianResult?.levelCount, 20, 'Barbarian should have 20 levels');

  const clericResult = results.find(r => r.className === 'cleric');
  t.true(clericResult?.valid, 'Cleric should be valid');
  t.is(clericResult?.levelCount, 20, 'Cleric should have 20 levels');

  const wizardResult = results.find(r => r.className === 'wizard');
  t.true(wizardResult?.valid, 'Wizard should be valid');
  t.is(wizardResult?.levelCount, 20, 'Wizard should have 20 levels');
});

// Test that all subclass files exist
test('All subclass definition files exist for each class', async t => {
  const classSubclassMap: Record<string, string[]> = {
    barbarian: ['berserker', 'wild-heart', 'world-tree', 'zealot'],
    bard: ['lore', 'swords', 'glamour', 'eloquence', 'spirits', 'whispers'],
    cleric: [
      'life',
      'light',
      'knowledge',
      'nature',
      'tempest',
      'trickery',
      'war',
      'grave',
      'forge',
      'peace',
    ],
    druid: ['land', 'moon', 'shepherd', 'spores', 'dreams', 'wildfire', 'peace'],
    fighter: ['champion', 'battle-master', 'eldritch-knight', 'psi-knight', 'rune-knight'],
    monk: ['open-hand', 'shadow', 'four-elements', 'mercy', 'long-death'],
    paladin: ['devotion', 'conquest', 'ancients', 'vengeance', 'glory', 'redemption'],
    ranger: ['beast-master', 'fey-wanderer', 'gloom-stalker', 'hunter', 'phantom', 'swarmkeeper'],
    rogue: ['thief', 'assassin', 'arcane-trickster', 'phantom', 'soul-knife', 'inquisitive'],
    sorcerer: [
      'draconic',
      'wild-magic',
      'shadow-magic',
      'aberrant-mind',
      'clockwork-soul',
      'lunar-sorcery',
    ],
    warlock: ['fiend', 'great-old-one', 'archfey', 'celestial', 'genie', 'hexblade'],
    wizard: [
      'abjurer',
      'conjurer',
      'diviner',
      'evoker',
      'illusionist',
      'enchanter',
      'necromancer',
      'transmuter',
    ],
  };

  let totalSubclasses = 0;
  let missingCount = 0;

  for (const [className, subclasses] of Object.entries(classSubclassMap)) {
    for (const subclass of subclasses) {
      totalSubclasses++;
      const filePath = join(
        baseDir,
        'src',
        'seed',
        'classes',
        className,
        'subclasses',
        `${subclass}.json`,
      );

      try {
        const content = readFileSync(filePath, 'utf-8');
        JSON.parse(content);
      } catch (err) {
        missingCount++;
        t.fail(
          `Missing or invalid: ${className}/${subclass}.json - ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  t.is(
    missingCount,
    0,
    `All subclass files should exist and be valid JSON (${totalSubclasses} total)`,
  );
});

// Test that className in JSON matches the expected format (English, capitalized)
test('className values match expected English capitalization', async t => {
  const classNameMap: Record<string, string> = {
    barbarian: 'Barbarian',
    bard: 'Bard',
    cleric: 'Cleric',
    druid: 'Druid',
    fighter: 'Fighter',
    monk: 'Monk',
    paladin: 'Paladin',
    ranger: 'Ranger',
    rogue: 'Rogue',
    sorcerer: 'Sorcerer',
    warlock: 'Warlock',
    wizard: 'Wizard',
  };

  for (const [dir, expectedName] of Object.entries(classNameMap)) {
    const filePath = join(baseDir, 'src', 'seed', 'classes', dir, 'levels.json');
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    t.is(
      data.className,
      expectedName,
      `${dir}/levels.json should have className "${expectedName}", got "${data.className}"`,
    );
  }
});

// Test that each class has exactly 20 levels
test('Each class has exactly 20 levels', async t => {
  const classes = [
    'barbarian',
    'bard',
    'cleric',
    'druid',
    'fighter',
    'monk',
    'paladin',
    'ranger',
    'rogue',
    'sorcerer',
    'warlock',
    'wizard',
  ];

  for (const className of classes) {
    const filePath = join(baseDir, 'src', 'seed', 'classes', className, 'levels.json');
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    t.is(data.levels.length, 20, `${className} should have 20 levels, got ${data.levels.length}`);
  }
});
