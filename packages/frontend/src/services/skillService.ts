import { CharacterResponseDto } from '@rpg-gen/shared';
import { DnDRulesService } from './dndRulesService';

/**
 * Map ability names to their score keys in the character
 */
const abilityMap: Record<string, string> = {
  strength: 'Str',
  dexterity: 'Dex',
  constitution: 'Con',
  intelligence: 'Int',
  wisdom: 'Wis',
  charisma: 'Cha',
};

type Scores = Record<string, number>;
interface SkillEntry { name?: string;
  proficient?: boolean;
  modifier?: number; }

/**
 * Calculate ability modifier from score
 */
const getAbilityModifier = (score: number) => Math.floor((score - 10) / 2);

/**
 * Get ability score from character scores
 */
const getAbilityScore = (scores: Scores | undefined, key: string): number => (scores?.[key] ?? 10);

/**
 * Find a skill in the character's skills array (case-insensitive)
 */
const findCharacterSkill = (
  skills: SkillEntry[] | undefined,
  skillName: string,
): SkillEntry | undefined => skills?.find(s => (s.name ?? '').toLowerCase() === skillName.toLowerCase());

/**
 * Find a skill in DnD rules (case-insensitive)
 */
const findRulesSkill = (skillName: string) => DnDRulesService.getAllSkills()
  .find(s => s.name.toLowerCase() === skillName.toLowerCase());

/**
 * Calculate modifier for a skill using rules mapping
 */
const calculateSkillModifier = (
  character: CharacterResponseDto,
  skillName: string,
): number | undefined => {
  const rulesSkill = findRulesSkill(skillName);
  if (!rulesSkill || !character.scores) return undefined;

  const abilityScore = getAbilityScore(character.scores as Scores, rulesSkill.ability);
  let modifier = getAbilityModifier(abilityScore);

  const charSkill = findCharacterSkill(character.skills as SkillEntry[], skillName);
  if (charSkill?.proficient) modifier += character.proficiency ?? 2;

  return modifier;
};

/**
 * Handle "Ability (Skill)" format e.g., "Strength (Athletics)"
 */
const handleAbilitySkillFormat = (
  character: CharacterResponseDto,
  abilityName: string,
  skillName: string,
): number => {
  // First try using DnD rules mapping
  const rulesModifier = calculateSkillModifier(character, skillName);
  if (rulesModifier !== undefined) return rulesModifier;

  // Fallback: try character's skills array
  const charSkill = findCharacterSkill(character.skills as SkillEntry[], skillName);
  if (charSkill?.modifier !== undefined) return charSkill.modifier;

  // Final fallback: use ability modifier directly
  const abilityKey = abilityMap[abilityName.toLowerCase()];
  if (!abilityKey || !character.scores) return 0;

  const abilityScore = getAbilityScore(character.scores as Scores, abilityKey);
  let modifier = getAbilityModifier(abilityScore);
  if (charSkill?.proficient) modifier += character.proficiency ?? 2;

  return modifier;
};

/**
 * Handle pure ability check (e.g., "Strength")
 */
const handleAbilityCheck = (character: CharacterResponseDto, abilityName: string): number | undefined => {
  const abilityKey = abilityMap[abilityName.toLowerCase()];
  if (!abilityKey || !character.scores) return undefined;
  return getAbilityModifier(getAbilityScore(character.scores as Scores, abilityKey));
};

/**
 * Handle skill lookup in character's skills array
 */
const handleSkillLookup = (character: CharacterResponseDto, skillName: string): number | undefined => {
  const charSkill = findCharacterSkill(character.skills as SkillEntry[], skillName);
  if (!charSkill) return undefined;

  if (typeof charSkill.modifier === 'number') return charSkill.modifier;
  return calculateSkillModifier(character, skillName) ?? charSkill.modifier ?? 0;
};

/**
 * Get the bonus for a specific skill check
 * Supports formats:
 * - "Perception Check" - looks up skill modifier
 * - "Strength (Athletics) Check" - uses ability + skill proficiency if applicable
 * - "Strength Check" - uses just the ability modifier
 */
export const getSkillBonus = (
  character: CharacterResponseDto | null,
  skillNameWithCheck: string,
): number => {
  if (!character) return 0;

  const nameWithoutCheck = skillNameWithCheck.replace(' Check', '')
    .trim();
  const abilitySkillMatch = nameWithoutCheck.match(/^(.+?)\s*\((.+?)\)$/u);

  if (abilitySkillMatch) {
    return handleAbilitySkillFormat(character, abilitySkillMatch[1].trim(), abilitySkillMatch[2].trim());
  }

  const abilityResult = handleAbilityCheck(character, nameWithoutCheck);
  if (abilityResult !== undefined) return abilityResult;

  const skillResult = handleSkillLookup(character, nameWithoutCheck);
  if (skillResult !== undefined) return skillResult;

  console.warn(`Skill/Ability "${nameWithoutCheck}" not found for character`);
  return 0;
};
