import test from 'ava';
import { Test } from '@nestjs/testing';
import { CombatModule, INIT_SERVICE_TOKEN } from '../src/domain/combat/combat.module.js';
import { CombatAppService } from '../src/domain/combat/combat.app.service.js';
import { InitService } from '../src/domain/combat/services/init.service.js';

test('CombatModule resolves CombatAppService and DI works', async (t) => {
  const moduleRef = await Test.createTestingModule({
    imports: [CombatModule],
  })
    .compile();

  const combatAppService = moduleRef.get(CombatAppService, { strict: false });
  t.truthy(combatAppService);
});

test('CombatModule resolves CombatAppService and InitService tokens', async (t) => {
  const moduleRef = await Test.createTestingModule({
    imports: [CombatModule],
  })
    .compile();

  const combatAppService = moduleRef.get(CombatAppService, { strict: false });
  const initClass = moduleRef.get(InitService, { strict: false });
  const initToken = moduleRef.get('InitService', { strict: false });
  const initCustomToken = moduleRef.get(INIT_SERVICE_TOKEN, { strict: false });

  t.truthy(combatAppService);
  t.truthy(initClass);
  t.truthy(initToken);
  t.truthy(initCustomToken);
});
