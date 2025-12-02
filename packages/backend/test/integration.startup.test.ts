import test from 'ava';
import { Test } from '@nestjs/testing';

import { RollsController } from '../src/controllers/rolls.controller.js';
import { ChatOrchestrator } from '../src/orchestrators/chat/index.js';

test('integration: RollsModule compiles using @nestjs/testing', async (t) => {
  t.plan(1);
  const moduleRef = await Test.createTestingModule({
    controllers: [RollsController],
    providers: [
      {
        provide: ChatOrchestrator,
        useValue: {},
      },
    ],
  })
    .compile();
  t.truthy(moduleRef, 'TestingModule should compile');
  if (moduleRef && typeof (moduleRef as any).close === 'function') await (moduleRef as any).close();
});
