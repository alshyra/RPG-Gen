import { NarrativeResponseMapper } from '../api/dto/NarrativeResponseMapper.js';
import { Message } from '../domain/narrative/value-objects/Message.js';

describe('NarrativeResponseMapper', () => {
  describe('messageToDto', () => {
    test('should map a simple message', () => {
      const message = new Message({
        role: 'user',
        narrative: 'Hello there!',
      });

      const dto = NarrativeResponseMapper.messageToDto(message);

      expect(dto.role).toBe('user');
      expect(dto.narrative).toBe('Hello there!');
      expect(dto.instructions?.length).toBe(0);
    });

    test('should map message with instructions', () => {
      const message = new Message({
        role: 'assistant',
        narrative: 'You gain experience',
        instructions: [
          { type: 'xp', xp: 50 },
          { type: 'hp', hp: 10 },
        ],
      });

      const dto = NarrativeResponseMapper.messageToDto(message);

      expect(dto.role).toBe('assistant');
      expect(dto.narrative).toBe('You gain experience');
      expect(dto.instructions?.length).toBe(2);
      expect(dto.instructions?.[0].type).toBe('xp');
      expect(dto.instructions?.[1].type).toBe('hp');
    });

    test('should create a mutable copy of instructions', () => {
      const message = new Message({
        role: 'assistant',
        narrative: 'Test',
        instructions: [{ type: 'xp', xp: 10 }],
      });

      const dto = NarrativeResponseMapper.messageToDto(message);

      // Should be able to mutate the DTO's instructions (it's a copy)
      expect(() => {
        dto.instructions?.push({ type: 'hp', hp: 5 });
      }).not.toThrow();

      // Original message should still have only 1 instruction
      expect(message.instructions.length).toBe(1);
      // DTO should now have 2
      expect(dto.instructions?.length).toBe(2);
    });
  });

  describe('messagesToDtos', () => {
    test('should map array of messages with roles', () => {
      const messages = [
        new Message({ role: 'user', narrative: 'First message' }),
        new Message({ role: 'assistant', narrative: 'Second message', instructions: [{ type: 'xp', xp: 10 }] }),
        new Message({ role: 'user', narrative: 'Third message' }),
      ];

      const dtos = NarrativeResponseMapper.messagesToDtos(messages);

      expect(dtos.length).toBe(3);
      expect(dtos[0].role).toBe('user');
      expect(dtos[0].narrative).toBe('First message');
      expect(dtos[1].role).toBe('assistant');
      expect(dtos[1].narrative).toBe('Second message');
      expect(dtos[1].instructions?.length).toBe(1);
      expect(dtos[2].role).toBe('user');
      expect(dtos[2].narrative).toBe('Third message');
    });

    test('should handle empty array', () => {
      const dtos = NarrativeResponseMapper.messagesToDtos([]);
      expect(dtos.length).toBe(0);
    });
  });
});
