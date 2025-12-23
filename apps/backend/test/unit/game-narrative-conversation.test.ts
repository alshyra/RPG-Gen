import test from 'ava';
import { Conversation } from '../../src/bounded-contexts/game-narrative/domain/conversation/entities/Conversation.js';
import { Message } from '../../src/bounded-contexts/game-narrative/domain/conversation/value-objects/Message.js';

test('Conversation › should create a conversation with userId and characterId', (t) => {
  const conversation = new Conversation({
    userId: 'user-123',
    characterId: 'char-456',
  });
  t.is(conversation.userId, 'user-123');
  t.is(conversation.characterId, 'char-456');
  t.is(conversation.messages.length, 0);
});

test('Conversation › should add a message with role and narrative', (t) => {
  let conversation = new Conversation({
    userId: 'user-123',
    characterId: 'char-456',
  });
  const message = new Message({
    role: 'user',
    narrative: 'Hello!',
  });
  conversation = conversation.addMessage(message);

  t.is(conversation.messages.length, 1);
  t.is(conversation.messages[0].role, 'user');
  t.is(conversation.messages[0].narrative, 'Hello!');
});

test('Conversation › should get recent messages with limit', (t) => {
  let conversation = new Conversation({
    userId: 'user-123',
    characterId: 'char-456',
  });
  for (let i = 0; i < 10; i++) {
    conversation = conversation.addMessage(
      new Message({
        role: 'user',
        narrative: `Message ${i}`,
      }),
    );
  }

  const recent = conversation.getRecentMessages(5);
  t.is(recent.length, 5);
  t.is(recent[0].narrative, 'Message 5');
  t.is(recent[4].narrative, 'Message 9');
});

test('Conversation › should detect when conversation exceeds max messages', (t) => {
  let conversation = new Conversation({
    userId: 'user-123',
    characterId: 'char-456',
  });
  for (let i = 0; i < 10; i++) {
    conversation = conversation.addMessage(
      new Message({
        role: 'user',
        narrative: `Message ${i}`,
      }),
    );
  }

  t.is(conversation.isAtLimit(15), false);
  t.is(conversation.isAtLimit(10), true);
  t.is(conversation.isAtLimit(9), true);
});

test('Conversation › should get all instructions from messages', (t) => {
  let conversation = new Conversation({
    userId: 'user-123',
    characterId: 'char-456',
  });
  const msg1 = new Message({
    role: 'user',
    narrative: 'Hello',
  });
  const msg2 = new Message({
    role: 'assistant',
    narrative: 'Response',
    instructions: [
      { type: 'roll', data: { dice: '1d20' } },
      { type: 'xp', data: { amount: 100 } },
    ] as any[],
  });
  const msg3 = new Message({
    role: 'assistant',
    narrative: 'Another',
    instructions: [{ type: 'hp', data: { amount: 10 } }] as any[],
  });

  conversation = conversation.addMessage(msg1);
  conversation = conversation.addMessage(msg2);
  conversation = conversation.addMessage(msg3);

  const instructions = conversation.getAllInstructions();
  t.is(instructions.length, 3);
  t.is(instructions[0].type, 'roll');
  t.is(instructions[1].type, 'xp');
  t.is(instructions[2].type, 'hp');
});

test('Conversation › should get instructions by type', (t) => {
  let conversation = new Conversation({
    userId: 'user-123',
    characterId: 'char-456',
  });
  const msg = new Message({
    role: 'assistant',
    narrative: 'Response',
    instructions: [
      { type: 'roll', data: { dice: '1d20' } },
      { type: 'xp', data: { amount: 100 } },
      { type: 'roll', data: { dice: '2d6' } },
    ] as any[],
  });

  conversation = conversation.addMessage(msg);

  const rolls = conversation.getInstructionsByType('roll');
  t.is(rolls.length, 2);
  t.deepEqual(rolls[0], { type: 'roll', data: { dice: '1d20' } });
  t.deepEqual(rolls[1], { type: 'roll', data: { dice: '2d6' } });
});
