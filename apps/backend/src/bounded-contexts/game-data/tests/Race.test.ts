import test from 'ava';
import { Race } from '../domain/race/entities/Race.js';
import { RacialBonuses } from '../domain/race/value-objects/RacialBonuses.js';
import { TraitEffect } from '../domain/race/value-objects/TraitEffect.js';

test('Race - creates with required properties', t => {
  const race = new Race({
    id: 'humain',
    name: 'Humain',
    bonuses: new RacialBonuses({ vigor: 1, finesse: 1, mind: 1, survival: 1 }),
    trait: 'Polyvalent',
    traitEffect: new TraitEffect({ type: 'pa_bonus', value: 1, condition: 'turn_1' }),
  });

  t.is(race.id, 'humain');
  t.is(race.name, 'Humain');
  t.is(race.trait, 'Polyvalent');
  t.is(race.bonuses.vigor, 1);
});

test('Race - fromSeedData creates from JSON structure', t => {
  const seedData = {
    id: 'nain',
    name: 'Nain',
    bonuses: { vigor: 2, survival: 1 },
    trait: 'Résistant',
    traitEffect: { type: 'resistance' as const, value: 2, condition: 'permanent' as const },
    descriptionForAi: 'Robuste et résistant',
    icon: '🪓',
    color: '#a16207',
  };

  const race = Race.fromSeedData(seedData);

  t.is(race.id, 'nain');
  t.is(race.name, 'Nain');
  t.is(race.bonuses.vigor, 2);
  t.is(race.bonuses.finesse, 0);
  t.is(race.trait, 'Résistant');
  t.is(race.icon, '🪓');
});

test('Race - isTraitActive returns true for permanent traits', t => {
  const race = new Race({
    id: 'test',
    name: 'Test',
    bonuses: new RacialBonuses({ vigor: 1 }),
    trait: 'Always Active',
    traitEffect: new TraitEffect({ type: 'buff', value: 1, condition: 'permanent' }),
  });

  t.true(race.isTraitActive({ turn: 1 }));
  t.true(race.isTraitActive({ turn: 5 }));
});

test('Race - isTraitActive returns true only on turn 1 for turn_1 condition', t => {
  const race = new Race({
    id: 'humain',
    name: 'Humain',
    bonuses: new RacialBonuses({ vigor: 1 }),
    trait: 'First Turn Bonus',
    traitEffect: new TraitEffect({ type: 'pa_bonus', value: 1, condition: 'turn_1' }),
  });

  t.true(race.isTraitActive({ turn: 1 }));
  t.false(race.isTraitActive({ turn: 2 }));
  t.false(race.isTraitActive({ turn: 5 }));
});

test('Race - isTraitActive handles HP conditions', t => {
  const race = new Race({
    id: 'berserk',
    name: 'Berserk',
    bonuses: new RacialBonuses({ vigor: 2 }),
    trait: 'Rage',
    traitEffect: new TraitEffect({ type: 'damage_bonus', value: 5, condition: 'hp_below_50' }),
  });

  t.false(race.isTraitActive({ hpPercent: 100 }));
  t.false(race.isTraitActive({ hpPercent: 75 }));
  t.false(race.isTraitActive({ hpPercent: 50 }));
  t.true(race.isTraitActive({ hpPercent: 49 }));
  t.true(race.isTraitActive({ hpPercent: 25 }));
});

test('Race - getBonusForStat returns correct values', t => {
  const race = new Race({
    id: 'test',
    name: 'Test',
    bonuses: new RacialBonuses({ vigor: 2, finesse: 1 }),
    trait: 'Test',
    traitEffect: new TraitEffect({ type: 'buff', value: 1 }),
  });

  t.is(race.getBonusForStat('vigor'), 2);
  t.is(race.getBonusForStat('finesse'), 1);
  t.is(race.getBonusForStat('mind'), 0);
  t.is(race.getBonusForStat('survival'), 0);
});

test('RacialBonuses - universal bonus applies to all stats', t => {
  const bonuses = new RacialBonuses({ '*': 1 });

  t.is(bonuses.vigor, 1);
  t.is(bonuses.finesse, 1);
  t.is(bonuses.mind, 1);
  t.is(bonuses.survival, 1);
});

test('RacialBonuses - specific bonuses add to universal', t => {
  const bonuses = new RacialBonuses({ '*': 1, vigor: 1 });

  t.is(bonuses.vigor, 2);
  t.is(bonuses.finesse, 1);
});

test('Race - throws error if id is missing', t => {
  const error = t.throws(() => {
    new Race({
      id: '',
      name: 'Test',
      bonuses: new RacialBonuses({ vigor: 1 }),
      trait: 'Test',
      traitEffect: new TraitEffect({ type: 'buff', value: 1 }),
    });
  });

  t.is(error?.message, 'Race ID is required');
});
