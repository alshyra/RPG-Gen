import { Narrative } from '../domain/entities/Narrative.js';
import { Message } from '../domain/value-objects/Message.js';
import { Context } from '../domain/value-objects/Context.js';

describe('Narrative', () => {
  test('should create a narrative with userId, characterId and context', () => {
    const context = new Context({
      characterContext: {
        name: 'Test Character',
        race: 'Human',
        className: 'Warrior',
        level: 1,
        currentHp: 100,
        maxHp: 100,
      },
      systemPrompt: 'Test system prompt',
      scenarioPrompt: 'Test scenario prompt',
    });

    const narrative = new Narrative({
      userId: 'user-123',
      characterId: 'char-456',
      sessionId: 'user-123_char-456',
      context,
      messages: [],
    });

    expect(narrative.userId).toBe('user-123');
    expect(narrative.characterId).toBe('char-456');
    expect(narrative.sessionId).toBe('user-123_char-456');
    expect(narrative.messages.length).toBe(0);
    expect(narrative.context).toEqual(context);
  });

  test('should add a message with role and narrative', () => {
    const context = new Context({
      characterContext: {
        name: 'Test Character',
        race: 'Human',
        className: 'Warrior',
        level: 1,
        currentHp: 100,
        maxHp: 100,
      },
      systemPrompt: 'Test system prompt',
      scenarioPrompt: 'Test scenario prompt',
    });

    let narrative = new Narrative({
      userId: 'user-123',
      characterId: 'char-456',
      sessionId: 'user-123_char-456',
      context,
      messages: [],
    });

    const message = new Message({
      role: 'user',
      narrative: 'Hello!',
    });

    narrative = narrative.addMessage(message);

    expect(narrative.messages.length).toBe(1);
    expect(narrative.messages[0].role).toBe('user');
    expect(narrative.messages[0].narrative).toBe('Hello!');
  });

  test('should add multiple messages preserving order', () => {
    const context = new Context({
      characterContext: {
        name: 'Test Character',
        race: 'Human',
        className: 'Warrior',
        level: 1,
        currentHp: 100,
        maxHp: 100,
      },
      systemPrompt: 'Test system prompt',
      scenarioPrompt: 'Test scenario prompt',
    });

    let narrative = new Narrative({
      userId: 'user-123',
      characterId: 'char-456',
      sessionId: 'user-123_char-456',
      context,
      messages: [],
    });

    const message1 = new Message({ role: 'user', narrative: 'First message' });
    const message2 = new Message({ role: 'assistant', narrative: 'Second message' });
    const message3 = new Message({ role: 'user', narrative: 'Third message' });

    narrative = narrative.addMessage(message1);
    narrative = narrative.addMessage(message2);
    narrative = narrative.addMessage(message3);

    expect(narrative.messages.length).toBe(3);
    expect(narrative.messages[0].narrative).toBe('First message');
    expect(narrative.messages[1].narrative).toBe('Second message');
    expect(narrative.messages[2].narrative).toBe('Third message');
  });

  test('should update context', () => {
    const context = new Context({
      characterContext: {
        name: 'Test Character',
        race: 'Human',
        className: 'Warrior',
        level: 1,
        currentHp: 100,
        maxHp: 100,
      },
      systemPrompt: 'Original prompt',
      scenarioPrompt: 'Original scenario',
    });

    let narrative = new Narrative({
      userId: 'user-123',
      characterId: 'char-456',
      sessionId: 'user-123_char-456',
      context,
      messages: [],
    });

    const newContext = new Context({
      characterContext: {
        name: 'Test Character',
        race: 'Human',
        className: 'Warrior',
        level: 2,
        currentHp: 80,
        maxHp: 120,
      },
      systemPrompt: 'Updated prompt',
      scenarioPrompt: 'Updated scenario',
    });

    narrative = narrative.updateContext(newContext);

    expect(narrative.context.characterContext.level).toBe(2);
    expect(narrative.context.characterContext.currentHp).toBe(80);
    expect(narrative.context.characterContext.maxHp).toBe(120);
    expect(narrative.context.systemPrompt).toBe('Updated prompt');
  });

  test('should retrieve last N messages', () => {
    const context = new Context({
      characterContext: {
        name: 'Test Character',
        race: 'Human',
        className: 'Warrior',
        level: 1,
        currentHp: 100,
        maxHp: 100,
      },
      systemPrompt: 'Test prompt',
      scenarioPrompt: 'Test scenario',
    });

    let narrative = new Narrative({
      userId: 'user-123',
      characterId: 'char-456',
      sessionId: 'user-123_char-456',
      context,
      messages: [],
    });

    for (let i = 0; i < 5; i++) {
      narrative = narrative.addMessage(new Message({ role: 'user', narrative: `Message ${i + 1}` }));
    }

    // Get last 3 messages using slice
    const last3 = narrative.messages.slice(-3);
    expect(last3.length).toBe(3);
    expect(last3[0].narrative).toBe('Message 3');
    expect(last3[1].narrative).toBe('Message 4');
    expect(last3[2].narrative).toBe('Message 5');
  });

  test('should get all instructions from messages', () => {
    const context = new Context({
      characterContext: {
        name: 'Test Character',
        race: 'Human',
        className: 'Warrior',
        level: 1,
        currentHp: 100,
        maxHp: 100,
      },
      systemPrompt: 'Test prompt',
      scenarioPrompt: 'Test scenario',
    });

    let narrative = new Narrative({
      userId: 'user-123',
      characterId: 'char-456',
      sessionId: 'user-123_char-456',
      context,
      messages: [],
    });

    const message1 = new Message({
      role: 'assistant',
      narrative: 'Test',
      instructions: [
        { type: 'xp', xp: 10 },
        { type: 'hp', hp: -5 },
      ],
    });

    const message2 = new Message({
      role: 'assistant',
      narrative: 'Test 2',
      instructions: [{ type: 'roll', dices: '1d20' }],
    });

    narrative = narrative.addMessage(message1);
    narrative = narrative.addMessage(message2);

    const allInstructions = narrative.getAllInstructions();
    expect(allInstructions.length).toBe(3);
    expect(allInstructions[0].type).toBe('xp');
    expect(allInstructions[1].type).toBe('hp');
    expect(allInstructions[2].type).toBe('roll');
  });

  test('should filter instructions by type', () => {
    const context = new Context({
      characterContext: {
        name: 'Test Character',
        race: 'Human',
        className: 'Warrior',
        level: 1,
        currentHp: 100,
        maxHp: 100,
      },
      systemPrompt: 'Test prompt',
      scenarioPrompt: 'Test scenario',
    });

    let narrative = new Narrative({
      userId: 'user-123',
      characterId: 'char-456',
      sessionId: 'user-123_char-456',
      context,
      messages: [],
    });

    const message = new Message({
      role: 'assistant',
      narrative: 'Test',
      instructions: [
        { type: 'xp', xp: 10 },
        { type: 'hp', hp: -5 },
        { type: 'xp', xp: 15 },
      ],
    });

    narrative = narrative.addMessage(message);

    const xpInstructions = narrative.getInstructionsByType('xp');
    expect(xpInstructions.length).toBe(2);
    expect((xpInstructions[0] as any).xp).toBe(10);
    expect((xpInstructions[1] as any).xp).toBe(15);

    const hpInstructions = narrative.getInstructionsByType('hp');
    expect(hpInstructions.length).toBe(1);
    expect((hpInstructions[0] as any).hp).toBe(-5);
  });
});
