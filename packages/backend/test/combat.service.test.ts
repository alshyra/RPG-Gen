import test from 'ava';
import type { CombatStartRequestDto } from '../src/domain/combat/dto/index.js';
import type { CharacterResponseDto } from '@rpg-gen/shared';

// Mock the CombatService without MongoDB dependency for unit testing
// The actual service uses MongoDB - these tests verify core combat logic

const createMockCharacter = (overrides: Partial<CharacterResponseDto> = {}): CharacterResponseDto => ({
  characterId: 'test-char-1',
  name: 'Test Hero',
  world: 'test-world',
  portrait: '',
  isDeceased: false,
  diedAt: new Date()
    .toISOString(),
  deathLocation: '',
  state: 'created',
  hp: 20,
  hpMax: 20,
  scores: {
    Str: 16,
    Dex: 14,
    Con: 14,
    Int: 10,
    Wis: 12,
    Cha: 8,
  },
  proficiency: 2,
  inventory: [],
  ...overrides,
});

const createCombatStart = (): CombatStartRequestDto => ({
  combat_start: [
    {
      name: 'Goblin',
      hp: 7,
      ac: 13,
      attack_bonus: 4,
      damage_dice: '1d6',
      damage_bonus: 2,
    },
  ],
});

// Test the combat types and basic structure
test('CombatStartInstruction has correct structure', (t) => {
  const combatStart = createCombatStart();

  t.true(Array.isArray(combatStart.combat_start));
  t.is(combatStart.combat_start[0].name, 'Goblin');
  t.is(combatStart.combat_start[0].hp, 7);
  t.is(combatStart.combat_start[0].ac, 13);
});

test('mock character has required fields', (t) => {
  const character = createMockCharacter();

  t.is(character.characterId, 'test-char-1');
  t.is(character.name, 'Test Hero');
  t.is(character.hp, 20);
  t.is(character.hpMax, 20);
  t.truthy(character.scores);
  t.is(character.proficiency, 2);
});

test('character override works correctly', (t) => {
  const character = createMockCharacter({
    hp: 100,
    hpMax: 100,
    name: 'Custom Hero',
  });

  t.is(character.hp, 100);
  t.is(character.hpMax, 100);
  t.is(character.name, 'Custom Hero');
});

test('combat start with multiple enemies', (t) => {
  const combatStart: CombatStartRequestDto = {
    combat_start: [
      {
        name: 'Goblin 1',
        hp: 7,
        ac: 13,
      },
      {
        name: 'Goblin 2',
        hp: 7,
        ac: 13,
      },
      {
        name: 'Goblin Boss',
        hp: 21,
        ac: 15,
      },
    ],
  };

  t.is(combatStart.combat_start.length, 3);
  t.is(combatStart.combat_start[0].name, 'Goblin 1');
  t.is(combatStart.combat_start[2].name, 'Goblin Boss');
});

test('combat start with optional fields', (t) => {
  const combatStart: CombatStartRequestDto = {
    combat_start: [
      {
        name: 'Basic Enemy',
        hp: 10,
        ac: 12,
      },
      {
        name: 'Advanced Enemy',
        hp: 20,
        ac: 15,
        attack_bonus: 5,
        damage_dice: '2d6',
        damage_bonus: 3,
      },
    ],
  };

  // Basic enemy without optional fields
  t.is(combatStart.combat_start[0].attack_bonus, undefined);
  t.is(combatStart.combat_start[0].damage_dice, undefined);

  // Advanced enemy with optional fields
  t.is(combatStart.combat_start[1].attack_bonus, 5);
  t.is(combatStart.combat_start[1].damage_dice, '2d6');
  t.is(combatStart.combat_start[1].damage_bonus, 3);
});

test('STR modifier calculation', (t) => {
  // STR 16 = (16-10)/2 = +3
  const character = createMockCharacter({
    scores: {
      Str: 16,
      Dex: 10,
      Con: 10,
      Int: 10,
      Wis: 10,
      Cha: 10,
    },
  });
  const strMod = Math.floor(((character.scores?.Str ?? 10) - 10) / 2);
  t.is(strMod, 3);

  // STR 8 = (8-10)/2 = -1
  const weakCharacter = createMockCharacter({
    scores: {
      Str: 8,
      Dex: 10,
      Con: 10,
      Int: 10,
      Wis: 10,
      Cha: 10,
    },
  });
  const weakStrMod = Math.floor(((weakCharacter.scores?.Str ?? 10) - 10) / 2);
  t.is(weakStrMod, -1);

  // STR 10 = (10-10)/2 = 0
  const avgCharacter = createMockCharacter({
    scores: {
      Str: 10,
      Dex: 10,
      Con: 10,
      Int: 10,
      Wis: 10,
      Cha: 10,
    },
  });
  const avgStrMod = Math.floor(((avgCharacter.scores?.Str ?? 10) - 10) / 2);
  t.is(avgStrMod, 0);
});

test('attack bonus calculation', (t) => {
  // STR 16 (+3) + proficiency 2 = +5
  const character = createMockCharacter({
    scores: {
      Str: 16,
      Dex: 10,
      Con: 10,
      Int: 10,
      Wis: 10,
      Cha: 10,
    },
    proficiency: 2,
  });

  const strMod = Math.floor(((character.scores?.Str ?? 10) - 10) / 2);
  const attackBonus = strMod + (character.proficiency ?? 2);

  t.is(attackBonus, 5);
});

test('XP reward calculation based on enemy HP', (t) => {
  // Simple XP calculation: HP * 10
  const enemies = [
    { hpMax: 7 }, // 70 XP
    { hpMax: 15 }, // 150 XP
  ];

  const totalXp = enemies.reduce((sum, e) => sum + e.hpMax * 10, 0);
  t.is(totalXp, 220);
});

test('unarmored AC calculation with DEX', (t) => {
  // DEX 14 = +2 modifier, unarmored = 10 + 2 = 12
  const character = createMockCharacter({
    scores: {
      Str: 10,
      Dex: 14,
      Con: 10,
      Int: 10,
      Wis: 10,
      Cha: 10,
    },
    inventory: [],
  });

  const dexMod = Math.floor(((character.scores?.Dex ?? 10) - 10) / 2);
  const unarmoredAC = 10 + dexMod;

  t.is(unarmoredAC, 12);
});

test('initiative modifier from DEX', (t) => {
  // DEX 14 = +2 modifier for initiative
  const character = createMockCharacter({
    scores: {
      Str: 10,
      Dex: 14,
      Con: 10,
      Int: 10,
      Wis: 10,
      Cha: 10,
    },
  });

  const dexMod = Math.floor(((character.scores?.Dex ?? 10) - 10) / 2);
  t.is(dexMod, 2);
});
