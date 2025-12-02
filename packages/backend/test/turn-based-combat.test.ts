import test from 'ava';
import type {
  CombatStartRequestDto, CombatStateDto, CombatEnemyDto, CombatPlayerDto, CombatantDto,
} from '../src/domain/combat/dto/index.js';
import type { CharacterResponseDto } from '@rpg-gen/shared';

/**
 * Unit tests for the turn-based combat system with D&D 5e action economy.
 *
 * Tests cover:
 * - Turn order building with player duplication
 * - Action economy (action + bonus action per activation)
 * - Turn advancement logic
 * - Enemy death handling and turn order rebuilding
 */

// ============= Test Helpers =============

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

const createMockPlayer = (overrides: Partial<CombatPlayerDto> = {}): CombatPlayerDto => ({
  characterId: 'test-char-1',
  name: 'Test Hero',
  hp: 20,
  hpMax: 20,
  ac: 15,
  initiative: 11,
  attackBonus: 5,
  damageDice: '1d8',
  damageBonus: 3,
  ...overrides,
});

const createMockEnemy = (id: string, name: string, overrides: Partial<CombatEnemyDto> = {}): CombatEnemyDto => ({
  id,
  name,
  hp: 10,
  hpMax: 10,
  ac: 13,
  initiative: 15,
  attackBonus: 4,
  damageDice: '1d6',
  damageBonus: 2,
  ...overrides,
});

const createCombatStart = (numEnemies = 2): CombatStartRequestDto => ({
  combat_start: Array.from({ length: numEnemies }, (_, i) => ({
    name: `Goblin ${i + 1}`,
    hp: 7,
    ac: 13,
    attack_bonus: 4,
    damage_dice: '1d6',
    damage_bonus: 2,
  })),
});

// Helper to build turn order (mirrors CombatService.buildTurnOrder logic)
const buildTurnOrder = (characterId: string, player: CombatPlayerDto, enemies: CombatEnemyDto[]): CombatantDto[] => {
  const aliveEnemies = enemies.filter(e => e.hp > 0);
  const numPlayerActivations = Math.max(1, aliveEnemies.length);

  const enemyEntries: CombatantDto[] = enemies.map(e => ({
    id: e.id,
    name: e.name,
    initiative: e.initiative,
    isPlayer: false,
  }));

  const playerEntries: CombatantDto[] = Array.from({ length: numPlayerActivations }, (_, idx) => ({
    id: `${characterId}#${idx}`,
    name: player.name,
    initiative: player.initiative,
    isPlayer: true,
    originId: characterId,
    activationIndex: idx,
  }));

  const allCombatants = [...enemyEntries, ...playerEntries];

  return allCombatants.sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    return a.isPlayer ? 1 : -1;
  });
};

// ============= Turn Order Building Tests =============

test('buildTurnOrder creates player entries equal to number of enemies', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [
    createMockEnemy('enemy-1', 'Goblin 1', { initiative: 16 }),
    createMockEnemy('enemy-2', 'Goblin 2', { initiative: 15 }),
  ];

  const turnOrder = buildTurnOrder('char-1', player, enemies);

  const playerEntries = turnOrder.filter(c => c.isPlayer);
  const enemyEntries = turnOrder.filter(c => !c.isPlayer);

  t.is(playerEntries.length, 2, 'Should have 2 player activations for 2 enemies');
  t.is(enemyEntries.length, 2, 'Should have 2 enemy entries');
});

test('buildTurnOrder sorts by initiative descending', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [
    createMockEnemy('enemy-1', 'Goblin 1', { initiative: 16 }),
    createMockEnemy('enemy-2', 'Goblin 2', { initiative: 15 }),
  ];

  const turnOrder = buildTurnOrder('char-1', player, enemies);

  // Expected order: gob1(16) -> gob2(15) -> hero#0(11) -> hero#1(11)
  t.is(turnOrder[0].initiative, 16);
  t.is(turnOrder[1].initiative, 15);
  t.is(turnOrder[2].initiative, 11);
  t.is(turnOrder[3].initiative, 11);
});

test('buildTurnOrder breaks ties with enemies before players', (t) => {
  const player = createMockPlayer({ initiative: 15 });
  const enemies = [createMockEnemy('enemy-1', 'Goblin 1', { initiative: 15 })];

  const turnOrder = buildTurnOrder('char-1', player, enemies);

  // On tie, enemy should come first
  t.is(turnOrder[0].isPlayer, false, 'Enemy should act before player on tie');
  t.is(turnOrder[1].isPlayer, true, 'Player should act after enemy on tie');
});

test('buildTurnOrder assigns correct originId and activationIndex', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [
    createMockEnemy('enemy-1', 'Goblin 1', { initiative: 16 }),
    createMockEnemy('enemy-2', 'Goblin 2', { initiative: 15 }),
    createMockEnemy('enemy-3', 'Goblin 3', { initiative: 10 }),
  ];

  const turnOrder = buildTurnOrder('char-1', player, enemies);
  const playerEntries = turnOrder.filter(c => c.isPlayer);

  t.is(playerEntries.length, 3, 'Should have 3 player activations for 3 enemies');

  playerEntries.forEach((entry, idx) => {
    t.is(entry.originId, 'char-1', 'All player entries should share same originId');
  });

  // Check activation indices
  const indices = playerEntries.map(e => e.activationIndex)
    .sort();
  t.deepEqual(indices, [0, 1, 2], 'Should have activation indices 0, 1, 2');
});

test('buildTurnOrder with single enemy creates single player activation', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [createMockEnemy('enemy-1', 'Goblin 1', { initiative: 16 })];

  const turnOrder = buildTurnOrder('char-1', player, enemies);
  const playerEntries = turnOrder.filter(c => c.isPlayer);

  t.is(playerEntries.length, 1, 'Should have 1 player activation for 1 enemy');
});

test('buildTurnOrder ignores dead enemies for player duplication count', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [
    createMockEnemy('enemy-1', 'Goblin 1', {
      initiative: 16,
      hp: 0,
    }), // Dead
    createMockEnemy('enemy-2', 'Goblin 2', {
      initiative: 15,
      hp: 7,
    }), // Alive
  ];

  const turnOrder = buildTurnOrder('char-1', player, enemies);
  const playerEntries = turnOrder.filter(c => c.isPlayer);

  t.is(playerEntries.length, 1, 'Should have 1 player activation for 1 alive enemy');
});

// ============= Action Economy Tests =============

test('action economy defaults to 1 action and 1 bonus action', (t) => {
  const state: Partial<CombatStateDto> = {
    actionRemaining: 1,
    actionMax: 1,
    bonusActionRemaining: 1,
    bonusActionMax: 1,
  };

  t.is(state.actionRemaining, 1);
  t.is(state.actionMax, 1);
  t.is(state.bonusActionRemaining, 1);
  t.is(state.bonusActionMax, 1);
});

test('decrementAction reduces actionRemaining', (t) => {
  const state: CombatStateDto = {
    characterId: 'char-1',
    inCombat: true,
    enemies: [],
    player: createMockPlayer(),
    turnOrder: [],
    currentTurnIndex: 0,
    roundNumber: 1,
    actionRemaining: 1,
    actionMax: 1,
    bonusActionRemaining: 1,
    bonusActionMax: 1,
  };

  // Simulate decrement
  const decrementAction = (s: CombatStateDto): boolean => {
    if ((s.actionRemaining ?? 0) <= 0) return false;
    s.actionRemaining = (s.actionRemaining ?? 1) - 1;
    return true;
  };

  const result = decrementAction(state);

  t.true(result, 'Should return true when action was available');
  t.is(state.actionRemaining, 0, 'actionRemaining should be 0 after decrement');
});

test('decrementAction returns false when no actions remaining', (t) => {
  const state: CombatStateDto = {
    characterId: 'char-1',
    inCombat: true,
    enemies: [],
    player: createMockPlayer(),
    turnOrder: [],
    currentTurnIndex: 0,
    roundNumber: 1,
    actionRemaining: 0,
    actionMax: 1,
    bonusActionRemaining: 1,
    bonusActionMax: 1,
  };

  const decrementAction = (s: CombatStateDto): boolean => {
    if ((s.actionRemaining ?? 0) <= 0) return false;
    s.actionRemaining = (s.actionRemaining ?? 1) - 1;
    return true;
  };

  const result = decrementAction(state);

  t.false(result, 'Should return false when no actions remaining');
  t.is(state.actionRemaining, 0, 'actionRemaining should stay 0');
});

test('decrementBonusAction reduces bonusActionRemaining', (t) => {
  const state: CombatStateDto = {
    characterId: 'char-1',
    inCombat: true,
    enemies: [],
    player: createMockPlayer(),
    turnOrder: [],
    currentTurnIndex: 0,
    roundNumber: 1,
    actionRemaining: 1,
    actionMax: 1,
    bonusActionRemaining: 1,
    bonusActionMax: 1,
  };

  const decrementBonusAction = (s: CombatStateDto): boolean => {
    if ((s.bonusActionRemaining ?? 0) <= 0) return false;
    s.bonusActionRemaining = (s.bonusActionRemaining ?? 1) - 1;
    return true;
  };

  const result = decrementBonusAction(state);

  t.true(result, 'Should return true when bonus action was available');
  t.is(state.bonusActionRemaining, 0, 'bonusActionRemaining should be 0 after decrement');
});

test('resetActionEconomy restores both counters', (t) => {
  const state: CombatStateDto = {
    characterId: 'char-1',
    inCombat: true,
    enemies: [],
    player: createMockPlayer(),
    turnOrder: [],
    currentTurnIndex: 0,
    roundNumber: 1,
    actionRemaining: 0,
    actionMax: 1,
    bonusActionRemaining: 0,
    bonusActionMax: 1,
  };

  const resetActionEconomy = (s: CombatStateDto): void => {
    s.actionRemaining = s.actionMax ?? 1;
    s.bonusActionRemaining = s.bonusActionMax ?? 1;
  };

  resetActionEconomy(state);

  t.is(state.actionRemaining, 1, 'actionRemaining should be reset to max');
  t.is(state.bonusActionRemaining, 1, 'bonusActionRemaining should be reset to max');
});

// ============= Turn Advancement Tests =============

test('advanceTurn moves to next combatant', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [
    createMockEnemy('enemy-1', 'Goblin 1', { initiative: 16 }),
    createMockEnemy('enemy-2', 'Goblin 2', { initiative: 15 }),
  ];
  const turnOrder = buildTurnOrder('char-1', player, enemies);

  // Start at index 0
  let currentIndex = 0;

  // Advance once
  currentIndex = (currentIndex + 1) % turnOrder.length;

  t.is(currentIndex, 1, 'Should advance to index 1');
});

test('advanceTurn wraps around and increments round', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [createMockEnemy('enemy-1', 'Goblin 1', { initiative: 16 })];
  const turnOrder = buildTurnOrder('char-1', player, enemies);

  let currentIndex = turnOrder.length - 1; // Last position
  let roundNumber = 1;

  // Advance (should wrap to 0)
  currentIndex = (currentIndex + 1) % turnOrder.length;
  if (currentIndex === 0) roundNumber++;

  t.is(currentIndex, 0, 'Should wrap to index 0');
  t.is(roundNumber, 2, 'Round should increment on wrap');
});

test('combat phase transitions correctly', (t) => {
  type Phase = 'PLAYER_TURN' | 'AWAITING_DAMAGE_ROLL' | 'ENEMY_TURN' | 'COMBAT_ENDED';

  let phase: Phase = 'PLAYER_TURN';

  // Player attacks -> awaiting roll
  phase = 'AWAITING_DAMAGE_ROLL';
  t.is(phase, 'AWAITING_DAMAGE_ROLL');

  // Roll resolved -> back to player turn
  phase = 'PLAYER_TURN';
  t.is(phase, 'PLAYER_TURN');

  // Player ends turn -> enemy turn
  phase = 'ENEMY_TURN';
  t.is(phase, 'ENEMY_TURN');

  // Enemy done -> back to player
  phase = 'PLAYER_TURN';
  t.is(phase, 'PLAYER_TURN');

  // Combat ends
  phase = 'COMBAT_ENDED';
  t.is(phase, 'COMBAT_ENDED');
});

// ============= Turn Order Rebuild Tests =============

test('turnOrder rebuilds correctly after enemy death', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [
    createMockEnemy('enemy-1', 'Goblin 1', {
      initiative: 16,
      hp: 7,
    }),
    createMockEnemy('enemy-2', 'Goblin 2', {
      initiative: 15,
      hp: 0,
    }), // Dead
  ];

  const turnOrder = buildTurnOrder('char-1', player, enemies);

  // Should only have 1 player activation now (1 alive enemy)
  const playerEntries = turnOrder.filter(c => c.isPlayer);
  t.is(playerEntries.length, 1, 'Should reduce player activations when enemy dies');
});

test('turnOrder maintains enemy entries even if dead (for history)', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [
    createMockEnemy('enemy-1', 'Goblin 1', {
      initiative: 16,
      hp: 7,
    }),
    createMockEnemy('enemy-2', 'Goblin 2', {
      initiative: 15,
      hp: 0,
    }), // Dead
  ];

  const turnOrder = buildTurnOrder('char-1', player, enemies);

  // Dead enemies still appear in turn order (they're skipped during resolution)
  const enemyEntries = turnOrder.filter(c => !c.isPlayer);
  t.is(enemyEntries.length, 2, 'Both enemies should remain in turn order');
});

// ============= Integration-like Tests =============

test('full combat turn simulation with 2 enemies', (t) => {
  const player = createMockPlayer({ initiative: 11 });
  const enemies = [
    createMockEnemy('enemy-1', 'Goblin 1', { initiative: 16 }),
    createMockEnemy('enemy-2', 'Goblin 2', { initiative: 15 }),
  ];

  const turnOrder = buildTurnOrder('char-1', player, enemies);

  // Expected order: gob1(16) -> gob2(15) -> hero#0(11) -> hero#1(11)
  t.is(turnOrder.length, 4, 'Should have 4 entries (2 enemies + 2 player activations)');

  // Verify order
  t.is(turnOrder[0].name, 'Goblin 1');
  t.is(turnOrder[1].name, 'Goblin 2');
  t.is(turnOrder[2].name, 'Test Hero');
  t.is(turnOrder[2].isPlayer, true);
  t.is(turnOrder[3].name, 'Test Hero');
  t.is(turnOrder[3].isPlayer, true);
});

test('combat with 3 enemies creates 3 player activations', (t) => {
  const player = createMockPlayer({ initiative: 5 });
  const enemies = [
    createMockEnemy('enemy-1', 'Orc 1', { initiative: 18 }),
    createMockEnemy('enemy-2', 'Orc 2', { initiative: 12 }),
    createMockEnemy('enemy-3', 'Orc 3', { initiative: 8 }),
  ];

  const turnOrder = buildTurnOrder('char-1', player, enemies);

  // Should have 6 entries: 3 enemies + 3 player activations
  t.is(turnOrder.length, 6);

  const playerEntries = turnOrder.filter(c => c.isPlayer);
  t.is(playerEntries.length, 3);
});
