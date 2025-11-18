/**
 * D&D 5e Level Up Rules Engine
 * Handles HP gain, ASI, features, and spell slots
 */

import type { LevelUpResult } from '@shared/types';

interface ClassLevelUpRules {
  hpDie: number;
  proficiencyProgression: number[];
  asiLevels: number[];
  features: Record<number, string[]>;
}

// D&D 5e class definitions
const classRules: Record<string, ClassLevelUpRules> = {
  Barbarian: {
    hpDie: 12,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Unarmored Defense', 'Reckless Attack'],
      2: ['Danger Sense'],
      3: ['Primal Path'],
      5: ['Extra Attack', 'Fast Movement'],
      7: ['Feral Instinct'],
      9: ['Brutal Critical (1d6)'],
      11: ['Relentless Rage'],
      15: ['Primal Champion'],
      20: ['Primal Champion'],
    },
  },
  Bard: {
    hpDie: 8,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Spellcasting', 'Bardic Inspiration'],
      2: ['Jack of All Trades'],
      3: ['Bard College'],
      5: ['Bardic Inspiration Improvement'],
      10: ['Magical Secrets'],
      20: ['Superior Inspiration'],
    },
  },
  Cleric: {
    hpDie: 8,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Spellcasting', 'Channel Divinity'],
      2: ['Channel Divinity: Turn Undead'],
      5: ['Destroy Undead'],
      10: ['Divine Intervention'],
      20: ['Divine Intervention Improvement'],
    },
  },
  Druid: {
    hpDie: 8,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Spellcasting', 'Druidic'],
      2: ['Wild Shape'],
      4: ['Wild Shape Improvement'],
      8: ['Wild Shape Improvement'],
      18: ['Timeless Body'],
      20: ['Archdruid'],
    },
  },
  Fighter: {
    hpDie: 10,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Fighting Style', 'Second Wind'],
      2: ['Action Surge'],
      3: ['Martial Archetype'],
      5: ['Extra Attack'],
      6: ['Ability Score Improvement'],
      9: ['Indomitable'],
      13: ['Indomitable Improvement'],
      17: ['Indomitable Improvement'],
      20: ['Extra Attack Improvement'],
    },
  },
  Monk: {
    hpDie: 8,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Unarmored Defense', 'Martial Arts'],
      2: ['Ki', 'Unarmored Movement'],
      3: ['Monastic Tradition'],
      4: ['Ability Score Improvement', 'Slow Fall'],
      5: ['Extra Attack', 'Stunning Strike'],
      7: ['Evasion'],
      10: ['Purity of Body'],
      13: ['Tongue of the Sun and Moon'],
      14: ['Diamond Soul'],
      15: ['Timeless Body'],
      20: ['Perfect Self'],
    },
  },
  Paladin: {
    hpDie: 10,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Divine Sense', 'Lay on Hands'],
      2: ['Fighting Style', 'Spellcasting'],
      3: ['Divine Health', 'Sacred Oath'],
      5: ['Extra Attack'],
      9: ['Improved Divine Smite'],
      11: ['Improved Divine Smite'],
      18: ['Aura of Protection'],
      20: ['Holy Nimbus'],
    },
  },
  Ranger: {
    hpDie: 10,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Favored Enemy', 'Natural Explorer'],
      2: ['Fighting Style', 'Spellcasting'],
      3: ['Ranger Archetype'],
      5: ['Extra Attack'],
      8: ['Lands Stride'],
      14: ['Vanish'],
      15: ['Ranger Archetype Feature'],
      18: ['Feral Senses'],
      20: ['Foe Slayer'],
    },
  },
  Rogue: {
    hpDie: 8,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Expertise', 'Sneak Attack'],
      2: ['Cunning Action'],
      3: ['Roguish Archetype'],
      5: ['Uncanny Dodge'],
      7: ['Evasion'],
      11: ['Reliable Talent'],
      15: ['Slippery Mind'],
      20: ['Stroke of Luck'],
    },
  },
  Sorcerer: {
    hpDie: 6,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Spellcasting', 'Sorcerous Origin'],
      2: ['Font of Magic'],
      3: ['Metamagic'],
      6: ['Sorcerous Restoration'],
      9: ['Sorcerous Resilience'],
      14: ['Sorcerous Fortitude'],
      17: ['Metamagic Mastery'],
      20: ['Sorcerous Restoration Improvement'],
    },
  },
  Warlock: {
    hpDie: 8,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Otherworldly Patron', 'Pact Magic'],
      2: ['Eldritch Invocations'],
      3: ['Pact Boon'],
      5: ['Eldritch Invocation Improvement'],
      11: ['Mystic Arcanum (6th)'],
      13: ['Mystic Arcanum (7th)'],
      15: ['Mystic Arcanum (8th)'],
      17: ['Mystic Arcanum (9th)'],
      20: ['Eldritch Master'],
    },
  },
  Wizard: {
    hpDie: 6,
    proficiencyProgression: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    asiLevels: [4, 8, 12, 16, 19],
    features: {
      1: ['Spellcasting', 'Spellbook'],
      2: ['Arcane Recovery'],
      3: ['Arcane Tradition'],
      6: ['Arcane Tradition Feature'],
      10: ['Arcane Tradition Feature'],
      14: ['Arcane Tradition Feature'],
      18: ['Spell Mastery'],
      20: ['Signature Spells'],
    },
  },
};

export const dndLevelUpService = {
  /**
   * Calculate HP gain for level up
   * @param className - Class name
   * @param conModifier - Constitution modifier
   * @returns HP gain
   */
  calculateHPGain(className: string, conModifier: number): number {
    const rules = classRules[className];
    if (!rules) return 1 + conModifier; // fallback

    const hpDie = rules.hpDie;
    // Average HP die result (rounded down) + CON modifier
    const averageRoll = Math.floor(hpDie / 2) + 1;
    const hpGain = Math.max(1, averageRoll + conModifier);
    return hpGain;
  },

  /**
   * Check if this level grants Ability Score Improvement
   * @param className - Class name
   * @param newLevel - New level after leveling up
   * @returns true if ASI is granted
   */
  hasAbilityScoreImprovement(className: string, newLevel: number): boolean {
    const rules = classRules[className];
    if (!rules) return false;
    return rules.asiLevels.includes(newLevel);
  },

  /**
   * Get new features for this level
   * @param className - Class name
   * @param newLevel - New level after leveling up
   * @returns Array of new features
   */
  getNewFeatures(className: string, newLevel: number): string[] {
    const rules = classRules[className];
    if (!rules || !rules.features[newLevel]) return [];
    return rules.features[newLevel];
  },

  /**
   * Get proficiency bonus for a level
   * @param level - Character level
   * @returns Proficiency bonus
   */
  getProficiencyBonus(level: number): number {
    if (level < 5) return 2;
    if (level < 9) return 3;
    if (level < 13) return 4;
    if (level < 17) return 5;
    return 6;
  },

  /**
   * Process a full level up
   * @param className - Class name
   * @param currentLevel - Current level (before leveling up)
   * @param conModifier - Constitution modifier
   * @returns LevelUpResult with all changes
   */
  levelUp(className: string, currentLevel: number, conModifier: number): LevelUpResult {
    const newLevel = currentLevel + 1;

    if (newLevel > 20) {
      return {
        success: false,
        newLevel: currentLevel,
        hpGain: 0,
        hasASI: false,
        newFeatures: [],
        proficiencyBonus: this.getProficiencyBonus(currentLevel),
        message: 'Cannot level up beyond level 20',
      };
    }

    const hpGain = this.calculateHPGain(className, conModifier);
    const hasASI = this.hasAbilityScoreImprovement(className, newLevel);
    const newFeatures = this.getNewFeatures(className, newLevel);
    const proficiencyBonus = this.getProficiencyBonus(newLevel);

    return {
      success: true,
      newLevel,
      hpGain,
      hasASI,
      newFeatures,
      proficiencyBonus,
      message: `Leveled up to ${newLevel}! Gained ${hpGain} HP.${hasASI ? ' You get an Ability Score Improvement!' : ''}${newFeatures.length > 0 ? ` New features: ${newFeatures.join(', ')}` : ''}`,
    };
  },
};
