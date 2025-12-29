import { Aptitude } from '../domain/aptitude/entities/Aptitude.js';

describe('Aptitude', () => {
  test('creates with required properties', () => {
    const aptitude = new Aptitude({
      id: 'frappe_simple',
      name: 'Frappe Simple',
    });

    expect(aptitude.id).toBe('frappe_simple');
    expect(aptitude.name).toBe('Frappe Simple');
    expect(aptitude.paCost).toBe(1);
    expect(aptitude.cooldown).toBe(0);
    expect(aptitude.targetType).toBe('enemy');
    expect(aptitude.effectType).toBe('damage');
  });

  test('creates with all properties', () => {
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

    expect(aptitude.paCost).toBe(3);
    expect(aptitude.cooldown).toBe(2);
    expect(aptitude.targetType).toBe('area');
    expect(aptitude.range).toBe(5);
    expect(aptitude.basePower).toBe(20);
    expect(aptitude.scaling).toBe('mind');
    expect(aptitude.area).toBe('circle_2');
  });

  test('fromSeedData creates from JSON structure', () => {
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

    expect(aptitude.id).toBe('soin');
    expect(aptitude.targetType).toBe('ally');
    expect(aptitude.effectType).toBe('heal');
    expect(aptitude.descriptionForAi).toBe('Soigne un allié proche');
  });

  test('requiresLineOfSight returns false for self-targeting', () => {
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

    expect(selfTarget.requiresLineOfSight()).toBe(false);
    expect(enemyTarget.requiresLineOfSight()).toBe(true);
  });

  test('isAreaOfEffect returns true for area abilities', () => {
    const aoe = new Aptitude({
      id: 'explosion',
      name: 'Explosion',
      area: 'circle_2',
    });

    const single = new Aptitude({
      id: 'frappe',
      name: 'Frappe',
    });

    expect(aoe.isAreaOfEffect()).toBe(true);
    expect(single.isAreaOfEffect()).toBe(false);
  });

  test('throws error if id is missing', () => {
    expect(() => {
      new Aptitude({
        id: '',
        name: 'Test',
      });
    }).toThrow('Aptitude ID is required');
  });

  test('throws error if name is missing', () => {
    expect(() => {
      new Aptitude({
        id: 'test',
        name: '',
      });
    }).toThrow('Aptitude name is required');
  });
});
