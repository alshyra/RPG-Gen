import test from 'ava';
import { calculateArmorClass, getDexModifier, parseArmorAc } from '../src/character/armor-class.util.js';
import type { CharacterResponseDto, ItemResponseDto } from '@rpg-gen/shared';

// Helper to create a minimal character for testing
const createTestCharacter = (dex: number, inventory: ItemResponseDto[] = []): CharacterResponseDto => ({
  characterId: 'test-char',
  world: 'dnd',
  portrait: '',
  isDeceased: false,
  diedAt: new Date().toISOString(),
  deathLocation: '',
  state: 'created',
  scores: { Str: 10, Dex: dex, Con: 10, Int: 10, Wis: 10, Cha: 10 },
  inventory,
});

test('getDexModifier calculates correctly for various DEX scores', (t) => {
  t.is(getDexModifier(createTestCharacter(10)), 0); // 10 -> +0
  t.is(getDexModifier(createTestCharacter(14)), 2); // 14 -> +2
  t.is(getDexModifier(createTestCharacter(18)), 4); // 18 -> +4
  t.is(getDexModifier(createTestCharacter(8)), -1); // 8 -> -1
  t.is(getDexModifier(createTestCharacter(6)), -2); // 6 -> -2
  t.is(getDexModifier(createTestCharacter(20)), 5); // 20 -> +5
});

test('getDexModifier defaults to 0 when scores are missing', (t) => {
  const charNoScores: CharacterResponseDto = {
    characterId: 'test',
    world: 'dnd',
    portrait: '',
    isDeceased: false,
    diedAt: new Date().toISOString(),
    deathLocation: '',
    state: 'created',
  };
  t.is(getDexModifier(charNoScores), 0);
});

test('parseArmorAc parses light armor correctly', (t) => {
  const result = parseArmorAc('11 + Dex modifier');
  t.deepEqual(result, { baseAc: 11, addDex: true, maxDex: null });

  const result2 = parseArmorAc('12 + Dex modifier');
  t.deepEqual(result2, { baseAc: 12, addDex: true, maxDex: null });
});

test('parseArmorAc parses medium armor correctly', (t) => {
  const result = parseArmorAc('12 + Dex modifier (max 2)');
  t.deepEqual(result, { baseAc: 12, addDex: true, maxDex: 2 });

  const result2 = parseArmorAc('14 + Dex modifier (max 2)');
  t.deepEqual(result2, { baseAc: 14, addDex: true, maxDex: 2 });
});

test('parseArmorAc parses heavy armor correctly', (t) => {
  t.deepEqual(parseArmorAc('14'), { baseAc: 14, addDex: false, maxDex: null });
  t.deepEqual(parseArmorAc('16'), { baseAc: 16, addDex: false, maxDex: null });
  t.deepEqual(parseArmorAc('18'), { baseAc: 18, addDex: false, maxDex: null });
});

test('parseArmorAc parses shield correctly', (t) => {
  const result = parseArmorAc('+2');
  t.deepEqual(result, { baseAc: 2, addDex: false, maxDex: null });
});

test('calculateArmorClass returns 10 + DEX for unarmored character', (t) => {
  const char10Dex = createTestCharacter(10, []);
  t.is(calculateArmorClass(char10Dex), 10); // 10 + 0

  const char14Dex = createTestCharacter(14, []);
  t.is(calculateArmorClass(char14Dex), 12); // 10 + 2

  const char18Dex = createTestCharacter(18, []);
  t.is(calculateArmorClass(char18Dex), 14); // 10 + 4
});

test('calculateArmorClass with light armor adds full DEX', (t) => {
  const leather = {
    name: 'Leather',
    qty: 1,
    equipped: true,
    meta: { type: 'armor', class: 'Light Armor', ac: '11 + Dex modifier' },
  };
  const char14Dex = createTestCharacter(14, [leather]);
  t.is(calculateArmorClass(char14Dex), 13); // 11 + 2

  const studdedLeather = {
    name: 'Studded Leather',
    qty: 1,
    equipped: true,
    meta: { type: 'armor', class: 'Light Armor', ac: '12 + Dex modifier' },
  };
  const char18Dex = createTestCharacter(18, [studdedLeather]);
  t.is(calculateArmorClass(char18Dex), 16); // 12 + 4
});

test('calculateArmorClass with medium armor caps DEX at max 2', (t) => {
  const chainShirt = {
    name: 'Chain Shirt',
    qty: 1,
    equipped: true,
    meta: { type: 'armor', class: 'Medium Armor', ac: '13 + Dex modifier (max 2)' },
  };

  // High DEX character should be capped
  const char18Dex = createTestCharacter(18, [chainShirt]);
  t.is(calculateArmorClass(char18Dex), 15); // 13 + 2 (capped)

  // Low DEX character uses full bonus
  const char12Dex = createTestCharacter(12, [chainShirt]);
  t.is(calculateArmorClass(char12Dex), 14); // 13 + 1
});

test('calculateArmorClass with heavy armor ignores DEX', (t) => {
  const chainMail = {
    name: 'Chain Mail',
    qty: 1,
    equipped: true,
    meta: { type: 'armor', class: 'Heavy Armor', ac: '16' },
  };

  const char18Dex = createTestCharacter(18, [chainMail]);
  t.is(calculateArmorClass(char18Dex), 16); // 16, no DEX

  const char8Dex = createTestCharacter(8, [chainMail]);
  t.is(calculateArmorClass(char8Dex), 16); // 16, no DEX (even with negative)
});

test('calculateArmorClass with shield adds +2', (t) => {
  const shield = {
    name: 'Shield',
    qty: 1,
    equipped: true,
    meta: { type: 'armor', class: 'Shield', ac: '+2' },
  };

  // Just shield (unarmored + shield)
  const char14Dex = createTestCharacter(14, [shield]);
  t.is(calculateArmorClass(char14Dex), 14); // 10 + 2 (dex) + 2 (shield)
});

test('calculateArmorClass with armor and shield combined', (t) => {
  const chainMail = {
    name: 'Chain Mail',
    qty: 1,
    equipped: true,
    meta: { type: 'armor', class: 'Heavy Armor', ac: '16' },
  };
  const shield = {
    name: 'Shield',
    qty: 1,
    equipped: true,
    meta: { type: 'armor', class: 'Shield', ac: '+2' },
  };

  const char = createTestCharacter(14, [
    chainMail,
    shield,
  ]);
  t.is(calculateArmorClass(char), 18); // 16 + 2
});

test('calculateArmorClass ignores unequipped armor', (t) => {
  const plate = {
    name: 'Plate',
    qty: 1,
    equipped: false, // Not equipped!
    meta: { type: 'armor', class: 'Heavy Armor', ac: '18' },
  };

  const char = createTestCharacter(14, [plate]);
  t.is(calculateArmorClass(char), 12); // 10 + 2 (unarmored)
});

test('calculateArmorClass ignores non-armor items', (t) => {
  const sword = {
    name: 'Longsword',
    qty: 1,
    equipped: true,
    meta: { type: 'weapon', damage: '1d8' },
  };

  const char = createTestCharacter(14, [sword]);
  t.is(calculateArmorClass(char), 12); // 10 + 2 (unarmored)
});
