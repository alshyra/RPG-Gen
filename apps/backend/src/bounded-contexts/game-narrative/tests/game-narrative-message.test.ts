import { Message } from '../domain/value-objects/Message.js';

describe('Message', () => {
  test('should create a message with role and narrative', () => {
    const message = new Message({
      role: 'user',
      narrative: 'Hello world!',
    });

    expect(message.role).toBe('user');
    expect(message.narrative).toBe('Hello world!');
    expect(message.instructions.length).toBe(0);
    expect(message.timestamp).toBeTruthy();
    expect(message.timestamp instanceof Date).toBe(true);
  });

  test('should create a message with instructions', () => {
    const message = new Message({
      role: 'assistant',
      narrative: 'You gained experience!',
      instructions: [{ type: 'xp', xp: 10 }],
    });

    expect(message.role).toBe('assistant');
    expect(message.narrative).toBe('You gained experience!');
    expect(message.instructions.length).toBe(1);
    expect(message.instructions[0].type).toBe('xp');
  });

  test('should throw error if narrative is empty', () => {
    expect(() => {
      new Message({
        role: 'user',
        narrative: '',
      });
    }).toThrow('Message narrative cannot be empty');
  });

  test('should throw error if narrative is only whitespace', () => {
    expect(() => {
      new Message({
        role: 'user',
        narrative: '   ',
      });
    }).toThrow('Message narrative cannot be empty');
  });

  test('hasInstructions should return false for empty instructions', () => {
    const message = new Message({
      role: 'user',
      narrative: 'Hello',
    });

    expect(message.hasInstructions()).toBe(false);
  });

  test('hasInstructions should return true when instructions exist', () => {
    const message = new Message({
      role: 'assistant',
      narrative: 'Take damage',
      instructions: [{ type: 'hp', hp: -10 }],
    });

    expect(message.hasInstructions()).toBe(true);
  });

  test('should filter instructions by type', () => {
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
    expect(xpInstructions.length).toBe(2);

    const hpInstructions = message.getInstructionsByType('hp');
    expect(hpInstructions.length).toBe(1);

    const rollInstructions = message.getInstructionsByType('roll');
    expect(rollInstructions.length).toBe(0);
  });

  test('should use custom timestamp if provided', () => {
    const customDate = new Date('2024-01-01T00:00:00Z');
    const message = new Message({
      role: 'user',
      narrative: 'Hello',
      timestamp: customDate,
    });

    expect(message.timestamp.getTime()).toBe(customDate.getTime());
  });
});
