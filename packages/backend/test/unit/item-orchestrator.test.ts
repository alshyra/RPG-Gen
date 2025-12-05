/**
 * Unit tests for ItemOrchestrator
 */
import test from 'ava';
import { ItemOrchestrator } from '../../src/orchestrators/item/item.orchestrator.js';

// ============= Mock Services =============

function createMockCharacterService(character: { inventory?: { _id: string;
  name: string;
  meta?: Record<string, unknown>; }[];
hp?: number;
hpMax?: number; } = {}) {
  return {
    findByCharacterId: async () => ({
      characterId: 'test-char',
      inventory: character.inventory ?? [],
      hp: character.hp ?? 10,
      hpMax: character.hpMax ?? 20,
    }),
    removeInventoryItem: async () => ({}),
    update: async () => ({}),
  };
}

function createMockCombatService(inCombat = false) {
  return {
    isInCombat: async () => inCombat,
    applyPlayerHeal: async (_characterId: string, healAmount: number) => ({
      characterId: 'test-char',
      inCombat: true,
      player: {
        hp: 15 + healAmount,
        hpMax: 20,
      },
      enemies: [],
      turnOrder: [],
      currentTurnIndex: 0,
      roundNumber: 1,
      phase: 'PLAYER_TURN',
      actionRemaining: 1,
      actionMax: 1,
      bonusActionRemaining: 1,
      bonusActionMax: 1,
    }),
  };
}

function createMockDiceService(total = 5) {
  return {
    rollDiceExpr: () => ({
      rolls: [3, 2],
      modifierValue: 2,
      total,
    }),
  };
}

// ============= Tests =============

test('useItem throws if item not found', async (t) => {
  const orchestrator = new ItemOrchestrator(
    createMockCharacterService({ inventory: [] }) as never,
    createMockCombatService() as never,
    createMockDiceService() as never,
  );

  const error = await t.throwsAsync(
    () => orchestrator.useItem('user1', 'char1', 'nonexistent'),
  );
  t.regex(error?.message ?? '', /not found/i);
});

test('useItem throws if item is not consumable', async (t) => {
  const orchestrator = new ItemOrchestrator(
    createMockCharacterService({
      inventory: [
        {
          _id: 'item1',
          name: 'Sword',
          meta: { type: 'weapon' },
        },
      ],
    }) as never,
    createMockCombatService() as never,
    createMockDiceService() as never,
  );

  const error = await t.throwsAsync(
    () => orchestrator.useItem('user1', 'char1', 'item1'),
  );
  t.regex(error?.message ?? '', /not a consumable/i);
});

test('useItem throws if potion used outside combat when combatUsable=true and restUsable=false', async (t) => {
  const orchestrator = new ItemOrchestrator(
    createMockCharacterService({
      inventory: [
        {
          _id: 'potion1',
          name: 'Health Potion',
          meta: {
            type: 'consumable',
            combatUsable: true,
            restUsable: false,
          },
        },
      ],
    }) as never,
    createMockCombatService(false) as never,
    createMockDiceService() as never,
  );

  const error = await t.throwsAsync(
    () => orchestrator.useItem('user1', 'char1', 'potion1'),
  );
  t.regex(error?.message ?? '', /only.*combat/i);
});

test('useItem throws if rations used in combat when combatUsable=false', async (t) => {
  const orchestrator = new ItemOrchestrator(
    createMockCharacterService({
      inventory: [
        {
          _id: 'rations1',
          name: 'Rations',
          meta: {
            type: 'consumable',
            combatUsable: false,
            restUsable: true,
          },
        },
      ],
    }) as never,
    createMockCombatService(true) as never,
    createMockDiceService() as never,
  );

  const error = await t.throwsAsync(
    () => orchestrator.useItem('user1', 'char1', 'rations1'),
  );
  t.regex(error?.message ?? '', /cannot.*combat/i);
});

test('useItem heals in combat and returns combatState', async (t) => {
  let removeCalled = false;
  const mockCharService = {
    ...createMockCharacterService({
      inventory: [
        {
          _id: 'potion1',
          name: 'Health Potion',
          meta: {
            type: 'consumable',
            combatUsable: true,
            healDice: '2d4+2',
          },
        },
      ],
    }),
    removeInventoryItem: async () => { removeCalled = true; },
  };

  const orchestrator = new ItemOrchestrator(
    mockCharService as never,
    createMockCombatService(true) as never,
    createMockDiceService(7) as never,
  );

  const result = await orchestrator.useItem('user1', 'char1', 'potion1');

  t.true(result.success);
  t.is(result.healAmount, 7);
  t.truthy(result.combatState);
  t.true(removeCalled);
});

test('useItem heals outside combat and returns character', async (t) => {
  let updateCalled = false;
  const mockCharService = {
    ...createMockCharacterService({
      hp: 10,
      hpMax: 20,
      inventory: [
        {
          _id: 'potion1',
          name: 'Health Potion',
          meta: {
            type: 'consumable',
            combatUsable: true,
            restUsable: true,
            healDice: '2d4+2',
          },
        },
      ],
    }),
    removeInventoryItem: async () => ({}),
    update: async () => { updateCalled = true; },
  };

  const orchestrator = new ItemOrchestrator(
    mockCharService as never,
    createMockCombatService(false) as never,
    createMockDiceService(7) as never,
  );

  const result = await orchestrator.useItem('user1', 'char1', 'potion1');

  t.true(result.success);
  t.is(result.healAmount, 7);
  t.truthy(result.character);
  t.true(updateCalled);
});

test('handleInventoryInstruction rejects non-use actions', async (t) => {
  const orchestrator = new ItemOrchestrator(
    createMockCharacterService() as never,
    createMockCombatService() as never,
    createMockDiceService() as never,
  );

  const error = await t.throwsAsync(
    () => orchestrator.handleInventoryInstruction('user1', 'char1', {
      type: 'inventory',
      action: 'add',
      name: 'something',
    }),
  );
  t.regex(error?.message ?? '', /only handles 'use'/i);
});

test('handleInventoryInstruction rejects missing itemId', async (t) => {
  const orchestrator = new ItemOrchestrator(
    createMockCharacterService() as never,
    createMockCombatService() as never,
    createMockDiceService() as never,
  );

  const error = await t.throwsAsync(
    () => orchestrator.handleInventoryInstruction('user1', 'char1', {
      type: 'inventory',
      action: 'use',
      name: 'Health Potion',
    }),
  );
  t.regex(error?.message ?? '', /itemId.*required/i);
});
