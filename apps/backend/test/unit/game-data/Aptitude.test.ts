import test from 'ava';
import { Aptitude } from '../../../src/bounded-contexts/game-data/domain/aptitude/entities/Aptitude.js';

test('Aptitude - creates with required properties', t => {
  const aptitude = new Aptitude({
    id: 'frappe_simple',
    name: 'Frappe Simple',
  });

  t.is(aptitude.id, 'frappe_simple');
  t.is(aptitude.name, 'Frappe Simple');
  t.is(aptitude.paCost, 1);
  t.is(aptitude.cooldown, 0);
  t.is(aptitude.targetType, 'enemy');
  t.is(aptitude.effectType, 'damage');
});

test('Aptitude - creates with all properties', t => {
  const aptitude = new Aptitude({
    id: 'boule_de_feu',
    name: 'Boule de Feu',
    paCost: 3,
    cooldown: 2,
    targetType: 'area',
    range: 5,
    basePower: 20,
    scaling: 'mind',
    effectType: 'damage',
    area: 'circle_2',
  });

  t.is(aptitude.paCost, 3);
  t.is(aptitude.cooldown, 2);
  t.is(aptitude.targetType, 'area');
  t.is(aptitude.range, 5);
  t.is(aptitude.basePower, 20);
  t.is(aptitude.scaling, 'mind');
  t.is(aptitude.area, 'circle_2');
});

test('Aptitude - fromSeedData creates from JSON structure', t => {
  const seedData = {
    id: 'soin',
    name: 'Soin',
    paCost: 2,
    targetType: 'ally' as const,
    range: 3,
    basePower: 15,
    scaling: 'mind' as const,
    effectType: 'heal' as const,
    descriptionForAi: 'Soigne un allié proche',
  };

  const aptitude = Aptitude.fromSeedData(seedData);

  t.is(aptitude.id, 'soin');
  t.is(aptitude.targetType, 'ally');
  t.is(aptitude.effectType, 'heal');
  t.is(aptitude.descriptionForAi, 'Soigne un allié proche');
});

test('Aptitude - requiresLineOfSight returns false for self-targeting', t => {
  const selfTarget = new Aptitude({
    id: 'posture',
    name: 'Posture Défensive',
    targetType: 'self',
  });

  const enemyTarget = new Aptitude({
    id: 'frappe',
    name: 'Frappe',
    targetType: 'enemy',
  });

  t.false(selfTarget.requiresLineOfSight());
  t.true(enemyTarget.requiresLineOfSight());
});

test('Aptitude - isAreaOfEffect returns true for area abilities', t => {
  const aoe = new Aptitude({
    id: 'explosion',
    name: 'Explosion',
    area: 'circle_2',
  });

  const single = new Aptitude({
    id: 'frappe',
    name: 'Frappe',
  });

  t.true(aoe.isAreaOfEffect());
  t.false(single.isAreaOfEffect());
});

test('Aptitude - throws error if id is missing', t => {
  const error = t.throws(() => {
    new Aptitude({
      id: '',
      name: 'Test',
    });
  });

  t.is(error?.message, 'Aptitude ID is required');
});

test('Aptitude - throws error if name is missing', t => {
  const error = t.throws(() => {
    new Aptitude({
      id: 'test',
      name: '',
    });
  });

  t.is(error?.message, 'Aptitude name is required');
});
