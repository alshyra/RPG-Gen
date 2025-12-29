import { Race } from '../domain/race/entities/Race.js';
import { RacialBonuses } from '../domain/race/value-objects/RacialBonuses.js';
import { TraitEffect } from '../domain/race/value-objects/TraitEffect.js';

describe('Race', () => {
  test('creates with required properties', () => {
    const race = new Race({
      id: 'humain',
      name: 'Humain',
      bonuses: new RacialBonuses({ vigor: 1, finesse: 1, mind: 1, survival: 1 }),
      trait: 'Polyvalent',
      traitEffect: new TraitEffect({ type: 'PA_BONUS', value: 1, condition: 'turn_1' }),
    });

    expect(race.id).toBe('humain');
    expect(race.name).toBe('Humain');
    expect(race.trait).toBe('Polyvalent');
    expect(race.bonuses.vigor).toBe(1);
  });

  test('fromSeedData creates from JSON structure', () => {
    const seedData = {
      id: 'nain',
      name: 'Nain',
      bonuses: { vigor: 2, survival: 1 },
      trait: 'Résistant',
      traitEffect: { type: 'DAMAGE_REDUCTION' as const, value: 2, condition: 'permanent' as const },
      descriptionForAi: 'Robuste et résistant',
      icon: '🪓',
      color: '#a16207',
    };

    const race = Race.fromSeedData(seedData);

    expect(race.id).toBe('nain');
    expect(race.name).toBe('Nain');
    expect(race.bonuses.vigor).toBe(2);
    expect(race.bonuses.finesse).toBe(0);
    expect(race.trait).toBe('Résistant');
    expect(race.icon).toBe('🪓');
  });

  test('isTraitActive returns true for permanent traits', () => {
    const race = new Race({
      id: 'test',
      name: 'Test',
      bonuses: new RacialBonuses({ vigor: 1 }),
      trait: 'Always Active',
      traitEffect: new TraitEffect({ type: 'DAMAGE_BOOST', value: 1, condition: 'permanent' }),
    });

    expect(race.isTraitActive({ turn: 1 })).toBe(true);
    expect(race.isTraitActive({ turn: 5 })).toBe(true);
  });

  test('isTraitActive returns true only on turn 1 for turn_1 condition', () => {
    const race = new Race({
      id: 'humain',
      name: 'Humain',
      bonuses: new RacialBonuses({ vigor: 1 }),
      trait: 'First Turn Bonus',
      traitEffect: new TraitEffect({ type: 'PA_BONUS', value: 1, condition: 'turn_1' }),
    });

    expect(race.isTraitActive({ turn: 1 })).toBe(true);
    expect(race.isTraitActive({ turn: 2 })).toBe(false);
    expect(race.isTraitActive({ turn: 5 })).toBe(false);
  });

  test('isTraitActive handles HP conditions', () => {
    const race = new Race({
      id: 'berserk',
      name: 'Berserk',
      bonuses: new RacialBonuses({ vigor: 2 }),
      trait: 'Rage',
      traitEffect: new TraitEffect({ type: 'DAMAGE_BOOST', value: 5, condition: 'hp_below_50' }),
    });

    expect(race.isTraitActive({ hpPercent: 100 })).toBe(false);
    expect(race.isTraitActive({ hpPercent: 75 })).toBe(false);
    expect(race.isTraitActive({ hpPercent: 50 })).toBe(false);
    expect(race.isTraitActive({ hpPercent: 49 })).toBe(true);
    expect(race.isTraitActive({ hpPercent: 25 })).toBe(true);
  });

  test('getBonusForStat returns correct values', () => {
    const race = new Race({
      id: 'test',
      name: 'Test',
      bonuses: new RacialBonuses({ vigor: 2, finesse: 1 }),
      trait: 'Test',
      traitEffect: new TraitEffect({ type: 'DAMAGE_BOOST', value: 1 }),
    });

    expect(race.getBonusForStat('vigor')).toBe(2);
    expect(race.getBonusForStat('finesse')).toBe(1);
    expect(race.getBonusForStat('mind')).toBe(0);
    expect(race.getBonusForStat('survival')).toBe(0);
  });

  test('throws error if id is missing', () => {
    expect(() => {
      new Race({
        id: '',
        name: 'Test',
        bonuses: new RacialBonuses({ vigor: 1 }),
        trait: 'Test',
        traitEffect: new TraitEffect({ type: 'DAMAGE_BOOST', value: 1 }),
      });
    }).toThrow('Race ID is required');
  });
});

describe('RacialBonuses', () => {
  test('universal bonus applies to all stats', () => {
    const bonuses = new RacialBonuses({ '*': 1 });

    expect(bonuses.vigor).toBe(1);
    expect(bonuses.finesse).toBe(1);
    expect(bonuses.mind).toBe(1);
    expect(bonuses.survival).toBe(1);
  });

  test('specific bonuses add to universal', () => {
    const bonuses = new RacialBonuses({ '*': 1, vigor: 1 });

    expect(bonuses.vigor).toBe(2);
    expect(bonuses.finesse).toBe(1);
  });
});
