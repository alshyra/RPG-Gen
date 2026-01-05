import { Context } from '../domain/value-objects/Context.js';

describe('Context', () => {
  test('should create a context with character data and prompts', () => {
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

    expect(context.characterContext.name).toBe('Aragorn');
    expect(context.characterContext.race).toBe('Human');
    expect(context.characterContext.className).toBe('guerrier');
    expect(context.characterContext.level).toBe(5);
    expect(context.characterContext.currentHp).toBe(45);
    expect(context.characterContext.maxHp).toBe(50);
    expect(context.systemPrompt).toBe('You are a game master');
    expect(context.scenarioPrompt).toBe('The party enters a dark forest');
  });

  test('should allow optional inventory in character context', () => {
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

    expect(context.characterContext.inventory).toBeTruthy();
    expect(context.characterContext.inventory?.length).toBe(3);
    expect(context.characterContext.inventory?.[0]).toEqual({name: 'Bow', quantity: 1});
  });


  test('should handle minimal character context', () => {
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

    expect(context.characterContext.name).toBe('Frodo');
    expect(context.characterContext.level).toBe(1);
    expect(context.characterContext.inventory).toBeFalsy();
  });
});
