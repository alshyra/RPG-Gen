import test from 'ava';
import { Message } from '../domain/narrative/value-objects/Message.js';

test('Message > should create a message with role and narrative', (t) => {
  const message = new Message({
    role: 'user',
    narrative: 'Hello world!',
  });

  t.is(message.role, 'user');
  t.is(message.narrative, 'Hello world!');
  t.is(message.instructions.length, 0);
  t.truthy(message.timestamp);
  t.true(message.timestamp instanceof Date);
});

test('Message > should create a message with instructions', (t) => {
  const message = new Message({
    role: 'assistant',
    narrative: 'You gained experience!',
    instructions: [{ type: 'xp', xp: 10 }],
  });

  t.is(message.role, 'assistant');
  t.is(message.narrative, 'You gained experience!');
  t.is(message.instructions.length, 1);
  t.is(message.instructions[0].type, 'xp');
});

test('Message > should throw error if narrative is empty', (t) => {
  const error = t.throws(() => {
    new Message({
      role: 'user',
      narrative: '',
    });
  });

  t.is(error?.message, 'Message narrative cannot be empty');
});

test('Message > should throw error if narrative is only whitespace', (t) => {
  const error = t.throws(() => {
    new Message({
      role: 'user',
      narrative: '   ',
    });
  });

  t.is(error?.message, 'Message narrative cannot be empty');
});

test('Message > hasInstructions should return false for empty instructions', (t) => {
  const message = new Message({
    role: 'user',
    narrative: 'Hello',
  });

  t.false(message.hasInstructions());
});

test('Message > hasInstructions should return true when instructions exist', (t) => {
  const message = new Message({
    role: 'assistant',
    narrative: 'Take damage',
    instructions: [{ type: 'hp', hp: -10 }],
  });

  t.true(message.hasInstructions());
});

test('Message > should filter instructions by type', (t) => {
  const message = new Message({
    role: 'assistant',
    narrative: 'Multiple effects',
    instructions: [
      { type: 'xp', xp: 10 },
      { type: 'hp', hp: -5 },
      { type: 'xp', xp: 15 },
    ],
  });

  const xpInstructions = message.getInstructionsByType('xp');
  t.is(xpInstructions.length, 2);

  const hpInstructions = message.getInstructionsByType('hp');
  t.is(hpInstructions.length, 1);

  const rollInstructions = message.getInstructionsByType('roll');
  t.is(rollInstructions.length, 0);
});

test('Message > should use custom timestamp if provided', (t) => {
  const customDate = new Date('2024-01-01T00:00:00Z');
  const message = new Message({
    role: 'user',
    narrative: 'Hello',
    timestamp: customDate,
  });

  t.is(message.timestamp.getTime(), customDate.getTime());
});
