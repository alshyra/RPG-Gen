import test from 'ava';
import { NarrativeResponseMapper } from '../api/dto/NarrativeResponseMapper.js';
import { Message } from '../domain/narrative/value-objects/Message.js';

test('NarrativeResponseMapper > messageToDto should map a simple message', (t) => {
  const message = new Message({
    role: 'user',
    narrative: 'Hello there!',
  });

  const dto = NarrativeResponseMapper.messageToDto(message);

  t.is(dto.narrative, 'Hello there!');
  t.is(dto.instructions?.length, 0);
});

test('NarrativeResponseMapper > messageToDto should map message with instructions', (t) => {
  const message = new Message({
    role: 'assistant',
    narrative: 'You gain experience',
    instructions: [
      { type: 'xp', xp: 50 },
      { type: 'hp', hp: 10 },
    ],
  });

  const dto = NarrativeResponseMapper.messageToDto(message);

  t.is(dto.narrative, 'You gain experience');
  t.is(dto.instructions?.length, 2);
  t.is(dto.instructions?.[0].type, 'xp');
  t.is(dto.instructions?.[1].type, 'hp');
});

test('NarrativeResponseMapper > messageToDto should create a mutable copy of instructions', (t) => {
  const message = new Message({
    role: 'assistant',
    narrative: 'Test',
    instructions: [{ type: 'xp', xp: 10 }],
  });

  const dto = NarrativeResponseMapper.messageToDto(message);

  // Should be able to mutate the DTO's instructions (it's a copy)
  t.notThrows(() => {
    dto.instructions?.push({ type: 'hp', hp: 5 });
  });

  // Original message should still have only 1 instruction
  t.is(message.instructions.length, 1);
  // DTO should now have 2
  t.is(dto.instructions?.length, 2);
});

test('NarrativeResponseMapper > messagesToDtos should map array of messages', (t) => {
  const messages = [
    new Message({ role: 'user', narrative: 'First message' }),
    new Message({ role: 'assistant', narrative: 'Second message', instructions: [{ type: 'xp', xp: 10 }] }),
    new Message({ role: 'user', narrative: 'Third message' }),
  ];

  const dtos = NarrativeResponseMapper.messagesToDtos(messages);

  t.is(dtos.length, 3);
  t.is(dtos[0].narrative, 'First message');
  t.is(dtos[1].narrative, 'Second message');
  t.is(dtos[1].instructions?.length, 1);
  t.is(dtos[2].narrative, 'Third message');
});

test('NarrativeResponseMapper > messagesToDtos should handle empty array', (t) => {
  const dtos = NarrativeResponseMapper.messagesToDtos([]);
  t.is(dtos.length, 0);
});
