/**
 * DnD Rules Service - Encapsulates all D&D 5e game rules
 * Handles ability calculations, HP, proficiency, etc.
 */

import { getCurrentLevel } from '../utils/dndLevels';

export const ABILITIES = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'] as const;
export const DEFAULT_BASE_SCORES = { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 } as const;

interface RaceModifiers {
  [key: string]: number;
}

interface HitDieMap {
  [className: string]: number;
}

interface Skill {
  name: string;
  ability: typeof ABILITIES[number];
}

interface ClassProficiencies {
  [className: string]: string[]; // skill names
}

// D&D 5e Skills mapped to abilities
const SKILLS: Skill[] = [
  { name: 'Acrobatics', ability: 'Dex' },
  { name: 'Animal Handling', ability: 'Wis' },
  { name: 'Arcana', ability: 'Int' },
  { name: 'Athletics', ability: 'Str' },
  { name: 'Deception', ability: 'Cha' },
  { name: 'History', ability: 'Int' },
  { name: 'Insight', ability: 'Wis' },
  { name: 'Intimidation', ability: 'Cha' },
  { name: 'Investigation', ability: 'Int' },
  { name: 'Medicine', ability: 'Wis' },
  { name: 'Nature', ability: 'Int' },
  { name: 'Perception', ability: 'Wis' },
  { name: 'Performance', ability: 'Cha' },
  { name: 'Persuasion', ability: 'Cha' },
  { name: 'Religion', ability: 'Int' },
  { name: 'Sleight of Hand', ability: 'Dex' },
  { name: 'Stealth', ability: 'Dex' },
  { name: 'Survival', ability: 'Wis' },
];

export const ALLOWED_RACES = [
  { id: 'human', name: 'Humain', mods: { Str: 1, Dex: 1, Con: 1, Int: 1, Wis: 1, Cha: 1 } },
  { id: 'dwarf', name: 'Nain', mods: { Con: 2 } },
  { id: 'elf', name: 'Elfe', mods: { Dex: 2 } },
  { id: 'halfling', name: 'Halfelin', mods: { Dex: 2 } },
  { id: 'gnome', name: 'Gnome', mods: { Int: 2 } },
  { id: 'half-elf', name: 'Demi-elfe', mods: { Cha: 2 } },
  { id: 'half-orc', name: 'Demi-orc', mods: { Str: 2, Con: 1 } },
  { id: 'tiefling', name: 'Tieffelin', mods: { Cha: 2, Int: 1 } },
  { id: 'dragonborn', name: 'Drakéide', mods: { Str: 2, Cha: 1 } },
] as const;

export const CLASSES_LIST = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
] as const;
export const GENDERS = ['male', 'female'] as const;
export const DEFAULT_RACE = ALLOWED_RACES[0];

// Class skill proficiencies (can choose X from this list)
const CLASS_SKILL_PROFICIENCIES: ClassProficiencies = {
  Barbarian: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
  Bard: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'],
  Cleric: ['Insight', 'Medicine', 'Persuasion', 'Religion'],
  Druid: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
  Fighter: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception'],
  Monk: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
  Paladin: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
  Ranger: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
  Rogue: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
  Sorcerer: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
  Warlock: ['Arcana', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
  Wizard: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
};

// How many skills can be chosen per class
const CLASS_SKILL_CHOICES: { [className: string]: number } = {
  Barbarian: 2,
  Bard: 3,
  Cleric: 2,
  Druid: 2,
  Fighter: 2,
  Monk: 2,
  Paladin: 2,
  Ranger: 3,
  Rogue: 4,
  Sorcerer: 2,
  Warlock: 2,
  Wizard: 2,
};

// D&D 5e Hit Dice by class
const HIT_DIE_MAP: HitDieMap = {
  Barbarian: 12,
  Fighter: 10,
  Paladin: 10,
  Ranger: 10,
  Rogue: 8,
  Bard: 8,
  Warlock: 8,
  Monk: 8,
  Cleric: 8,
  Druid: 8,
  Sorcerer: 6,
  Wizard: 6,
};

export class DnDRulesService {
  /**
   * Calculate modifier from ability score (D&D formula: (score - 10) / 2, rounded down)
   */
  static getAbilityModifier(abilityScore: number): number {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * Apply racial ability modifiers to base scores
   */
  static applyRacialModifiers(
    baseScores: Record<string, number>,
    raceModifiers: RaceModifiers,
  ): Record<string, number> {
    const result = { ...baseScores };
    Object.keys(raceModifiers).forEach((key) => {
      if (result[key] !== undefined) {
        result[key] += raceModifiers[key];
      }
    });
    return result;
  }

  /**
   * Calculate HP for level 1 character
   * HP = Hit Die + CON modifier (minimum 1)
   */
  static calculateHpForLevel1(className: string, conScore: number): number {
    const hitDie = HIT_DIE_MAP[className] || 8;
    const conModifier = this.getAbilityModifier(conScore);
    return Math.max(1, hitDie + conModifier);
  }

  /**
   * Get proficiency bonus for a given level or total XP
   */
  static getProficiencyBonus(levelOrXp: number, isXp: boolean = false): number {
    const xp = isXp ? levelOrXp : undefined;
    if (xp !== undefined) {
      const level = getCurrentLevel(xp);
      return level.proficiencyBonus;
    }
    // If treating as level
    const level = Math.max(1, Math.min(20, levelOrXp));
    if (level <= 4) return 2;
    if (level <= 8) return 3;
    if (level <= 12) return 4;
    if (level <= 16) return 5;
    return 6;
  }

  /**
   * Get available skills for a class
   */
  static getAvailableSkillsForClass(className: string): string[] {
    return CLASS_SKILL_PROFICIENCIES[className] || [];
  }

  /**
   * Get number of skill choices for a class
   */
  static getSkillChoicesForClass(className: string): number {
    return CLASS_SKILL_CHOICES[className] || 2;
  }

  /**
   * Get all skills with their ability modifiers
   */
  static getAllSkills(): Skill[] {
    return SKILLS;
  }

  /**
   * Calculate skill modifier for a given skill and ability scores
   */
  static calculateSkillModifier(skillName: string, scores: Record<string, number>, proficiency: number, isProficient: boolean): number {
    const skill = SKILLS.find(s => s.name === skillName);
    if (!skill) return 0;

    const abilityScore = scores[skill.ability] || 10;
    const modifier = this.getAbilityModifier(abilityScore);

    return isProficient ? modifier + proficiency : modifier;
  }

  /**
   * Prepare a new level 1 character with all calculated fields
   */
  static prepareNewCharacter(
    name: string,
    baseScores: Record<string, number>,
    className: string,
    raceModifiers: RaceModifiers,
    raceInfo: any,
    selectedSkills?: string[],
  ): any {
    // Apply racial bonuses
    const finalScores = this.applyRacialModifiers(baseScores, raceModifiers);

    // Calculate HP
    const hp = this.calculateHpForLevel1(className, finalScores.Con || 10);

    // Proficiency bonus for level 1
    const proficiency = this.getProficiencyBonus(1);

    // Initialize skills with proper modifiers
    const skills = SKILLS.map(skill => ({
      name: skill.name,
      proficient: (selectedSkills || []).includes(skill.name),
      modifier: this.calculateSkillModifier(skill.name, finalScores, proficiency, (selectedSkills || []).includes(skill.name)),
    }));

    return {
      name,
      scores: finalScores,
      hp,
      hpMax: hp,
      classes: [{ name: className, level: 1 }],
      race: raceInfo,
      totalXp: 0,
      proficiency,
      skills,
    };
  }
}
