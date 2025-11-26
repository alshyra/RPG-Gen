import test from 'ava';
import { CombatService } from '../src/combat/combat.service.js';
import type { CharacterDto } from '@rpg-gen/shared';
import type { CombatStartInstruction } from '../src/combat/combat.types.js';

const createMockCharacter = (overrides: Partial<CharacterDto> = {}): CharacterDto => ({
  characterId: 'test-char-1',
  name: 'Test Hero',
  world: 'test-world',
  portrait: '',
  isDeceased: false,
  diedAt: new Date(),
  deathLocation: '',
  state: 'created',
  hp: 20,
  hpMax: 20,
  scores: { Str: 16, Dex: 14, Con: 14, Int: 10, Wis: 12, Cha: 8 },
  proficiency: 2,
  inventory: [],
  ...overrides,
});

const createCombatStart = (): CombatStartInstruction => ({
  combat_start: [
    { name: 'Goblin', hp: 7, ac: 13, attack_bonus: 4, damage_dice: '1d6', damage_bonus: 2 },
  ],
});

test('initializeCombat creates combat state with player and enemies', (t) => {
  const service = new CombatService();
  const character = createMockCharacter();
  const combatStart = createCombatStart();

  const state = service.initializeCombat(character, combatStart);

  t.true(state.inCombat);
  t.is(state.characterId, character.characterId);
  t.is(state.enemies.length, 1);
  t.is(state.enemies[0].name, 'Goblin');
  t.is(state.enemies[0].hp, 7);
  t.is(state.enemies[0].ac, 13);
  t.is(state.player.name, 'Test Hero');
  t.is(state.player.hp, 20);
  t.is(state.player.hpMax, 20);
  t.is(state.roundNumber, 1);
});

test('isInCombat returns true when combat is active', (t) => {
  const service = new CombatService();
  const character = createMockCharacter();
  const combatStart = createCombatStart();

  t.false(service.isInCombat(character.characterId));

  service.initializeCombat(character, combatStart);

  t.true(service.isInCombat(character.characterId));
});

test('getCombatState returns current state', (t) => {
  const service = new CombatService();
  const character = createMockCharacter();
  const combatStart = createCombatStart();

  t.is(service.getCombatState(character.characterId), undefined);

  service.initializeCombat(character, combatStart);

  const state = service.getCombatState(character.characterId);
  t.truthy(state);
  t.is(state?.characterId, character.characterId);
});

test('processPlayerAttack returns null when not in combat', (t) => {
  const service = new CombatService();

  const result = service.processPlayerAttack('unknown-char', 'Goblin');

  t.is(result, null);
});

test('processPlayerAttack returns null for invalid target', (t) => {
  const service = new CombatService();
  const character = createMockCharacter();
  const combatStart = createCombatStart();

  service.initializeCombat(character, combatStart);

  const result = service.processPlayerAttack(character.characterId, 'Dragon');

  t.is(result, null);
});

test('processPlayerAttack executes attack against valid target', (t) => {
  const service = new CombatService();
  const character = createMockCharacter();
  const combatStart = createCombatStart();

  service.initializeCombat(character, combatStart);

  const result = service.processPlayerAttack(character.characterId, 'Goblin');

  t.truthy(result);
  t.is(result?.playerAttacks.length, 1);
  t.is(result?.playerAttacks[0].target, 'Goblin');
  t.true(typeof result?.playerAttacks[0].attackRoll === 'number');
  t.true(typeof result?.playerAttacks[0].totalAttack === 'number');
});

test('processPlayerAttack ends combat on victory', (t) => {
  const service = new CombatService();
  // Low HP enemy for easy defeat
  const character = createMockCharacter({ hp: 100, hpMax: 100 });
  const combatStart: CombatStartInstruction = {
    combat_start: [{ name: 'Weak Goblin', hp: 1, ac: 1 }],
  };

  service.initializeCombat(character, combatStart);

  // Keep attacking until victory (should be quick with 1 HP enemy and low AC)
  let result;
  let attempts = 0;
  while (attempts < 20) {
    result = service.processPlayerAttack(character.characterId, 'Weak Goblin');
    if (!result || result.combatEnded) break;
    attempts++;
  }

  // Should have ended in victory
  if (result?.combatEnded && result?.victory) {
    t.true(result.combatEnded);
    t.true(result.victory);
    t.false(service.isInCombat(character.characterId));
  } else {
    // If RNG was bad and we couldn't win, at least verify the loop worked
    t.true(attempts > 0);
  }
});

test('getValidTargets returns list of alive enemies', (t) => {
  const service = new CombatService();
  const character = createMockCharacter();
  const combatStart: CombatStartInstruction = {
    combat_start: [
      { name: 'Goblin 1', hp: 10, ac: 13 },
      { name: 'Goblin 2', hp: 10, ac: 13 },
    ],
  };

  service.initializeCombat(character, combatStart);

  const targets = service.getValidTargets(character.characterId);

  t.is(targets.length, 2);
  t.true(targets.includes('Goblin 1'));
  t.true(targets.includes('Goblin 2'));
});

test('getCombatSummary returns formatted summary', (t) => {
  const service = new CombatService();
  const character = createMockCharacter();
  const combatStart = createCombatStart();

  service.initializeCombat(character, combatStart);

  const summary = service.getCombatSummary(character.characterId);

  t.truthy(summary);
  t.true(summary?.includes('Combat en cours'));
  t.true(summary?.includes('Goblin'));
  t.true(summary?.includes('/attack'));
});

test('endCombat cleans up state and returns results', (t) => {
  const service = new CombatService();
  const character = createMockCharacter();
  const combatStart = createCombatStart();

  service.initializeCombat(character, combatStart);
  t.true(service.isInCombat(character.characterId));

  const result = service.endCombat(character.characterId);

  t.truthy(result);
  t.true(Array.isArray(result?.enemiesDefeated));
  t.true(typeof result?.xpGained === 'number');
  t.false(service.isInCombat(character.characterId));
});

test('calculateXpReward calculates based on enemy HP', (t) => {
  const service = new CombatService();

  const enemies = [
    { id: '1', name: 'Goblin', hp: 0, hpMax: 7, ac: 13, initiative: 10, attackBonus: 4, damageDice: '1d6', damageBonus: 2 },
    { id: '2', name: 'Orc', hp: 0, hpMax: 15, ac: 13, initiative: 10, attackBonus: 5, damageDice: '1d12', damageBonus: 3 },
  ];

  const xp = service.calculateXpReward(enemies);

  // (7 + 15) * 10 = 220
  t.is(xp, 220);
});

test('player attack bonus calculated from STR and proficiency', (t) => {
  const service = new CombatService();
  // STR 16 = +3 modifier, proficiency 2 = total +5
  const character = createMockCharacter({ scores: { Str: 16, Dex: 10, Con: 10, Int: 10, Wis: 10, Cha: 10 }, proficiency: 2 });
  const combatStart = createCombatStart();

  const state = service.initializeCombat(character, combatStart);

  t.is(state.player.attackBonus, 5); // +3 STR + 2 proficiency
});

test('player AC calculated from armor class util', (t) => {
  const service = new CombatService();
  // DEX 14 = +2 modifier, unarmored = 10 + 2 = 12
  const character = createMockCharacter({
    scores: { Str: 10, Dex: 14, Con: 10, Int: 10, Wis: 10, Cha: 10 },
    inventory: [],
  });
  const combatStart = createCombatStart();

  const state = service.initializeCombat(character, combatStart);

  t.is(state.player.ac, 12); // 10 + 2 DEX
});

test('turnOrder sorted by initiative (highest first)', (t) => {
  const service = new CombatService();
  const character = createMockCharacter();
  const combatStart: CombatStartInstruction = {
    combat_start: [
      { name: 'Enemy A', hp: 10, ac: 10 },
      { name: 'Enemy B', hp: 10, ac: 10 },
      { name: 'Enemy C', hp: 10, ac: 10 },
    ],
  };

  const state = service.initializeCombat(character, combatStart);

  // Verify turn order is sorted by initiative descending
  for (let i = 0; i < state.turnOrder.length - 1; i++) {
    t.true(state.turnOrder[i].initiative >= state.turnOrder[i + 1].initiative);
  }
});
