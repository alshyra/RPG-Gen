import { CharacterClass } from '../domain/class/entities/CharacterClass.js';
import { ClassStats } from '../domain/class/value-objects/ClassStats.js';
import { TalentTree } from '../domain/class/value-objects/TalentTree.js';

describe('CharacterClass', () => {
  test('creates with required properties', () => {
    const stats = new ClassStats({ hpBase: 10, hpGain: 4, pa: 6, pm: 3 });
    const characterClass = new CharacterClass({
      name: 'guerrier',
      stats,
    });

    expect(characterClass.name).toBe('guerrier');
    expect(characterClass.displayName).toBe('guerrier');
    expect(characterClass.stats.hpBase).toBe(10);
    expect(characterClass.stats.pa).toBe(6);
    expect(characterClass.proficiencies).toEqual([]);
    expect(characterClass.talentTrees).toEqual([]);
  });

  test('fromSeedData creates from JSON structure', () => {
    const seedData = {
      name: 'mage',
      displayName: 'Mage',
      description: 'Master of arcane arts',
      baseStats: { hp_base: 8, hp_gain: 3, pa: 6, pm: 3 },
      main_stat: 'mind',
      proficiencies: ['mind'],
      startingAptitudes: ['projectile_magique'],
      talentTrees: {
        destruction: {
          name: 'Voie de la Destruction',
          ranks: [
            { rank: 1, aptitudeId: 'boule_de_feu', pointCost: 1 },
            { rank: 2, aptitudeId: 'explosion', pointCost: 2 },
          ],
        },
      },
      color: '#8b5cf6',
      icon: '🧙',
    };

    const characterClass = CharacterClass.fromSeedData(seedData);

    expect(characterClass.name).toBe('mage');
    expect(characterClass.displayName).toBe('Mage');
    expect(characterClass.mainStat).toBe('mind');
    expect(characterClass.stats.hpBase).toBe(8);
    expect(characterClass.talentTrees.length).toBe(1);
    expect(characterClass.talentTrees[0].name).toBe('Voie de la Destruction');
    expect(characterClass.color).toBe('#8b5cf6');
  });

  test('getHpAtLevel returns correct HP', () => {
    const stats = new ClassStats({ hpBase: 10, hpGain: 4, pa: 6, pm: 3 });
    const characterClass = new CharacterClass({
      name: 'guerrier',
      stats,
    });

    expect(characterClass.getHpAtLevel(1)).toBe(10);
    expect(characterClass.getHpAtLevel(2)).toBe(14);
    expect(characterClass.getHpAtLevel(5)).toBe(26);
  });

  test('throws error if name is missing', () => {
    const stats = new ClassStats({ hpBase: 10, hpGain: 4, pa: 6, pm: 3 });
    
    expect(() => {
      new CharacterClass({
        name: '',
        stats,
      });
    }).toThrow('Class name is required');
  });
});

describe('ClassStats', () => {
  test('validates hpBase is at least 1', () => {
    expect(() => {
      new ClassStats({ hpBase: 0, hpGain: 4, pa: 6, pm: 3 });
    }).toThrow('Base HP must be at least 1');
  });
});

describe('TalentTree', () => {
  test('getAptitudeAtRank returns correct aptitude', () => {
    const tree = new TalentTree({
      voieId: 'combat',
      name: 'Voie du Combat',
      ranks: [
        { rank: 1, aptitudeId: 'frappe_simple', pointCost: 1 },
        { rank: 2, aptitudeId: 'coup_puissant', pointCost: 2 },
      ],
    });

    expect(tree.getAptitudeAtRank(1)).toBe('frappe_simple');
    expect(tree.getAptitudeAtRank(2)).toBe('coup_puissant');
    expect(tree.getAptitudeAtRank(3)).toBeUndefined();
  });

  test('getTotalCostUpToRank calculates correctly', () => {
    const tree = new TalentTree({
      voieId: 'combat',
      name: 'Voie du Combat',
      ranks: [
        { rank: 1, aptitudeId: 'frappe_simple', pointCost: 1 },
        { rank: 2, aptitudeId: 'coup_puissant', pointCost: 2 },
        { rank: 3, aptitudeId: 'tourbillon', pointCost: 3 },
      ],
    });

    expect(tree.getTotalCostUpToRank(1)).toBe(1);
    expect(tree.getTotalCostUpToRank(2)).toBe(3);
    expect(tree.getTotalCostUpToRank(3)).toBe(6);
  });
});
