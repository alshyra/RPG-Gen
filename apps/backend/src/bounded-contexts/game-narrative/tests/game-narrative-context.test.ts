import test from 'ava';
import { Context } from '../domain/narrative/value-objects/Context.js';

test('Context > should create a context with character data and prompts', (t) => {
  const context = new Context({
    characterContext: {
      name: 'Aragorn',
      race: 'Human',
      className: 'guerrier',
      level: 5,
      currentHp: 45,
      maxHp: 50,
    },
    systemPrompt: 'You are a game master',
    scenarioPrompt: 'The party enters a dark forest',
  });

  t.is(context.characterContext.name, 'Aragorn');
  t.is(context.characterContext.race, 'Human');
  t.is(context.characterContext.className, 'guerrier');
  t.is(context.characterContext.level, 5);
  t.is(context.characterContext.currentHp, 45);
  t.is(context.characterContext.maxHp, 50);
  t.is(context.systemPrompt, 'You are a game master');
  t.is(context.scenarioPrompt, 'The party enters a dark forest');
});

test('Context > should allow optional inventory in character context', (t) => {
  const context = new Context({
    characterContext: {
      name: 'Legolas',
      race: 'Elf',
      className: 'Archer',
      level: 4,
      currentHp: 30,
      maxHp: 35,
      inventory: [{name: 'Bow', quantity: 1}, {name: 'Arrows', quantity: 20}, {name: 'Elven cloak', quantity: 1}],
    },
    systemPrompt: 'You are a game master',
    scenarioPrompt: 'Adventure begins',
  });

  t.truthy(context.characterContext.inventory);
  t.is(context.characterContext.inventory?.length, 3);
  t.deepEqual(context.characterContext.inventory?.[0], {name: 'Bow', quantity: 1});
});


test('Context > should handle minimal character context', (t) => {
  const context = new Context({
    characterContext: {
      name: 'Frodo',
      race: 'Hobbit',
      className: 'Burglar',
      level: 1,
      currentHp: 20,
      maxHp: 20,
    },
    systemPrompt: 'Test prompt',
    scenarioPrompt: 'Test scenario',
  });

  t.is(context.characterContext.name, 'Frodo');
  t.is(context.characterContext.level, 1);
  t.falsy(context.characterContext.inventory);
});
