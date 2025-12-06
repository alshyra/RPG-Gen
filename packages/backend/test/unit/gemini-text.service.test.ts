import test from 'ava';
import { InternalServerErrorException } from '@nestjs/common';
import { GeminiTextService } from '../../src/infra/external/gemini-text.service.js';

test('sendMessage parses valid structured JSON into ChatMessageDto', async (t) => {
  const svc = new GeminiTextService();

  // create a fake chat client with a stable sendMessage response
  const fakeChat = {
    sendMessage: async () => ({
      text: JSON.stringify({
        narrative: 'A quick test scene',
        instructions: [
          {
            type: 'hp',
            hp: 5,
          },
        ],
      }),
    }),
  } as const;

  // inject fake chat session directly
  (svc as any).chatClients.set('test-session', fakeChat);

  const result = await svc.sendMessage('test-session', 'anything');

  t.is(result.role, 'assistant');
  t.is(result.narrative, 'A quick test scene');
  t.truthy(result.instructions);
  t.is(Array.isArray(result.instructions), true);
  t.is((result.instructions as any)[0].type, 'hp');
});

test('sendMessage throws if AI returns invalid JSON', async (t) => {
  const svc = new GeminiTextService();

  const fakeChat = {
    sendMessage: async () => ({ text: 'this is not json' }),
  } as const;

  (svc as any).chatClients.set('broken-session', fakeChat);

  const err = await t.throwsAsync(() => svc.sendMessage('broken-session', 'anything'));
  t.true(err instanceof InternalServerErrorException);
});

test('sendMessage unwraps payload-wrapped instructions before validation', async (t) => {
  const svc = new GeminiTextService();

  const fakeChat = {
    sendMessage: async () => ({
      text: JSON.stringify({
        narrative: 'Bardinou, you wake in an arena',
        instructions: [
          {
            type: 'combat_start',
            payload: {
              combat_start: [
                {
                  name: 'Goblin-1',
                  hp: 7,
                  ac: 10,
                  attack_bonus: 0,
                  damage_dice: '1d4',
                  damage_bonus: 0,
                },
              ],
            },
          },
        ],
      }),
    }),
  } as const;

  (svc as any).chatClients.set('payload-session', fakeChat);

  const result = await svc.sendMessage('payload-session', 'anything');

  t.is(result.role, 'assistant');
  t.is(result.narrative, 'Bardinou, you wake in an arena');
  t.truthy(result.instructions);
  t.is((result.instructions as any)[0].type, 'combat_start');
  t.true(Array.isArray((result.instructions as any)[0].combat_start));
  t.is((result.instructions as any)[0].combat_start[0].name, 'Goblin-1');
});
