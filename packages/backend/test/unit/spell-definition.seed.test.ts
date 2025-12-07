import test from 'ava';
import { SpellDefinitionService } from '../../src/domain/spell-definition/spell-definition.service.js';

test('seedFromJson rejects the entire seed if any entry is invalid', async (t) => {
  const svc = new SpellDefinitionService({} as any);

  // replace insertSpell with a simple collector that should not be called because validation fails
  const called: any[] = [];
  svc.insertSpell = async (s: any) => {
    called.push(s);
    return 'imported';
  };

  const raw = [
    {
      name: 'Valid Spell',
      level: '2',
      meta: { attackType: 'melee' },
    },
    {
      name: 'Invalid Spell',
      level: 'not-a-number',
    },
  ];

  const err = await t.throwsAsync(() => svc.seedFromJson(raw));
  t.truthy(err);
  t.is(called.length, 0, 'insertSpell should not be called when validation fails for any item');
});

test('seedFromJson coerces unknown attackType to undefined and still accepts the entry', async (t) => {
  const svc = new SpellDefinitionService({} as any);
  const captured: any[] = [];
  svc.insertSpell = async (s: any) => {
    captured.push(s);
    return 'imported';
  };

  const raw = [
    {
      name: 'Weird AttackType',
      level: 3,
      meta: { attackType: 'weird' },
    },
  ];

  await svc.seedFromJson(raw);

  t.is(captured.length, 1);
  t.is(captured[0].level, 3);
  t.falsy(captured[0].meta?.attackType);
});
