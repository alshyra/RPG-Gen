import test from 'ava';
import { CharacterClass } from '../../../src/bounded-contexts/game-data/domain/class/entities/CharacterClass.js';
import { ClassStats } from '../../../src/bounded-contexts/game-data/domain/class/value-objects/ClassStats.js';
import { TalentTree } from '../../../src/bounded-contexts/game-data/domain/class/value-objects/TalentTree.js';

test('CharacterClass - creates with required properties', t => {
  const stats = new ClassStats({ hpBase: 10, hpGain: 4, pa: 6, pm: 3 });
  const characterClass = new CharacterClass({
    name: 'guerrier',
    stats,
  });

  t.is(characterClass.name, 'guerrier');
  t.is(characterClass.displayName, 'guerrier');
  t.is(characterClass.stats.hpBase, 10);
  t.is(characterClass.stats.pa, 6);
  t.deepEqual(characterClass.proficiencies, []);
  t.deepEqual(characterClass.talentTrees, []);
});

test('CharacterClass - fromSeedData creates from JSON structure', t => {
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

  t.is(characterClass.name, 'mage');
  t.is(characterClass.displayName, 'Mage');
  t.is(characterClass.mainStat, 'mind');
  t.is(characterClass.stats.hpBase, 8);
  t.is(characterClass.talentTrees.length, 1);
  t.is(characterClass.talentTrees[0].name, 'Voie de la Destruction');
  t.is(characterClass.color, '#8b5cf6');
});

test('CharacterClass - getHpAtLevel returns correct HP', t => {
  const stats = new ClassStats({ hpBase: 10, hpGain: 4, pa: 6, pm: 3 });
  const characterClass = new CharacterClass({
    name: 'guerrier',
    stats,
  });

  t.is(characterClass.getHpAtLevel(1), 10);
  t.is(characterClass.getHpAtLevel(2), 14);
  t.is(characterClass.getHpAtLevel(5), 26);
});

test('CharacterClass - throws error if name is missing', t => {
  const stats = new ClassStats({ hpBase: 10, hpGain: 4, pa: 6, pm: 3 });
  
  const error = t.throws(() => {
    new CharacterClass({
      name: '',
      stats,
    });
  });

  t.is(error?.message, 'Class name is required');
});

test('ClassStats - validates hpBase is at least 1', t => {
  const error = t.throws(() => {
    new ClassStats({ hpBase: 0, hpGain: 4, pa: 6, pm: 3 });
  });

  t.is(error?.message, 'Base HP must be at least 1');
});

test('TalentTree - getAptitudeAtRank returns correct aptitude', t => {
  const tree = new TalentTree({
    voieId: 'combat',
    name: 'Voie du Combat',
    ranks: [
      { rank: 1, aptitudeId: 'frappe_simple', pointCost: 1 },
      { rank: 2, aptitudeId: 'coup_puissant', pointCost: 2 },
    ],
  });

  t.is(tree.getAptitudeAtRank(1), 'frappe_simple');
  t.is(tree.getAptitudeAtRank(2), 'coup_puissant');
  t.is(tree.getAptitudeAtRank(3), undefined);
});

test('TalentTree - getTotalCostUpToRank calculates correctly', t => {
  const tree = new TalentTree({
    voieId: 'combat',
    name: 'Voie du Combat',
    ranks: [
      { rank: 1, aptitudeId: 'frappe_simple', pointCost: 1 },
      { rank: 2, aptitudeId: 'coup_puissant', pointCost: 2 },
      { rank: 3, aptitudeId: 'tourbillon', pointCost: 3 },
    ],
  });

  t.is(tree.getTotalCostUpToRank(1), 1);
  t.is(tree.getTotalCostUpToRank(2), 3);
  t.is(tree.getTotalCostUpToRank(3), 6);
});
