import test from 'ava';
import { Narrative } from '../domain/narrative/entities/Narrative.js';
import { Message } from '../domain/narrative/value-objects/Message.js';
import { Context } from '../domain/narrative/value-objects/Context.js';

test('Narrative > should create a narrative with userId, characterId and context', (t) => {
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

  t.is(narrative.userId, 'user-123');
  t.is(narrative.characterId, 'char-456');
  t.is(narrative.sessionId, 'user-123_char-456');
  t.is(narrative.messages.length, 0);
  t.deepEqual(narrative.context, context);
});

test('Narrative > should add a message with role and narrative', (t) => {
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

  t.is(narrative.messages.length, 1);
  t.is(narrative.messages[0].role, 'user');
  t.is(narrative.messages[0].narrative, 'Hello!');
});

test('Narrative > should add multiple messages preserving order', (t) => {
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

  t.is(narrative.messages.length, 3);
  t.is(narrative.messages[0].narrative, 'First message');
  t.is(narrative.messages[1].narrative, 'Second message');
  t.is(narrative.messages[2].narrative, 'Third message');
});

test('Narrative > should update context', (t) => {
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

  t.is(narrative.context.characterContext.level, 2);
  t.is(narrative.context.characterContext.currentHp, 80);
  t.is(narrative.context.characterContext.maxHp, 120);
  t.is(narrative.context.systemPrompt, 'Updated prompt');
});

test('Narrative > should retrieve last N messages', (t) => {
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
  t.is(last3.length, 3);
  t.is(last3[0].narrative, 'Message 3');
  t.is(last3[1].narrative, 'Message 4');
  t.is(last3[2].narrative, 'Message 5');
});

test('Narrative > should get all instructions from messages', (t) => {
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
  t.is(allInstructions.length, 3);
  t.is(allInstructions[0].type, 'xp');
  t.is(allInstructions[1].type, 'hp');
  t.is(allInstructions[2].type, 'roll');
});

test('Narrative > should filter instructions by type', (t) => {
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
  t.is(xpInstructions.length, 2);
  t.is((xpInstructions[0] as any).amount, 10);
  t.is((xpInstructions[1] as any).amount, 15);

  const hpInstructions = narrative.getInstructionsByType('hp');
  t.is(hpInstructions.length, 1);
  t.is((hpInstructions[0] as any).amount, -5);
});
