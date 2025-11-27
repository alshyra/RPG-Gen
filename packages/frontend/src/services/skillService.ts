import type { CharacterDto } from '@rpg-gen/shared';
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

/**
 * Calculate ability modifier from score
 */
function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Get the bonus for a specific skill check
 * Supports formats:
 * - "Perception Check" - looks up skill modifier
 * - "Strength (Athletics) Check" - uses ability + skill proficiency if applicable
 * - "Strength Check" - uses just the ability modifier
 * @param character The character to get the skill bonus from
 * @param skillNameWithCheck Skill name with "Check" suffix
 * @returns The skill bonus modifier
 */

// eslint-disable-next-line max-statements
export const getSkillBonus = (
  character: CharacterDto | null,
  skillNameWithCheck: string,
): number => {
  if (!character) return 0;

  // Remove " Check" suffix
  const nameWithoutCheck = skillNameWithCheck.replace(' Check', '').trim();

  // Check for format "Ability (Skill)" e.g. "Strength (Athletics)" — allow unicode and spaces
  const abilitySkillMatch = nameWithoutCheck.match(/^(.+?)\s*\((.+?)\)$/u);

  if (abilitySkillMatch) {
    const abilityNameRaw = abilitySkillMatch[1].trim();
    const skillName = abilitySkillMatch[2].trim();

    // Prefer to resolve the skill using the DnD mapping (handles canonical skill->ability mapping)
    const rulesSkill = DnDRulesService.getAllSkills().find(s => s.name.toLowerCase() === skillName.toLowerCase());
    if (rulesSkill && character.scores) {
      // compute from the ability tied to the skill
      const abilityScore = (character.scores as Record<string, number>)[rulesSkill.ability] ?? 10;
      let modifier = getAbilityModifier(abilityScore);

      // if character has this skill and is proficient, add proficiency
      if (character.skills && Array.isArray(character.skills)) {
        const skill = character.skills.find(s => (s.name ?? '').toLowerCase() === skillName.toLowerCase());
        if (skill && skill.proficient) modifier += character.proficiency ?? 2;
      }
      return modifier;
    }

    // Fallback: try to map ability name to internal ability key (expect english keys)
    const abilityName = abilityNameRaw.toLowerCase();
    const abilityKey = abilityMap[abilityName];
    if (!abilityKey || !character.scores) {
      // If still unknown, attempt to resolve the skill itself in the character's skills array
      if (character.skills && Array.isArray(character.skills)) {
        const skill = character.skills.find(s => (s.name ?? '').toLowerCase() === skillName.toLowerCase());
        if (skill) return skill.modifier ?? 0;
      }
      return 0;
    }

    const abilityScore = (character.scores as Record<string, number>)[abilityKey] ?? 10;
    let modifier = getAbilityModifier(abilityScore);
    if (character.skills && Array.isArray(character.skills)) {
      const skill = character.skills.find(s => (s.name ?? '').toLowerCase() === skillName.toLowerCase());
      if (skill && skill.proficient) modifier += character.proficiency ?? 2;
    }
    return modifier;
  }

  // Check for pure ability check (e.g., "Strength Check")
  const abilityName = nameWithoutCheck.toLowerCase();
  const abilityKey = abilityMap[abilityName];
  if (abilityKey && character.scores) {
    const abilityScore = (character.scores as Record<string, number>)[abilityKey] ?? 10;
    return getAbilityModifier(abilityScore);
  }

  // Try to find the skill in character's skills array (legacy format)
  if (character.skills && Array.isArray(character.skills)) {
    const skill = character.skills.find(s =>
      (s.name ?? '').toLowerCase() === nameWithoutCheck.toLowerCase(),
    );
    if (skill) {
      // If an explicit modifier is present, use it. Otherwise compute based on ability + proficiency.
      if (typeof skill.modifier === 'number') return skill.modifier;

      // Compute using rules mapping
      const rulesSkill = DnDRulesService.getAllSkills().find(s => s.name.toLowerCase() === nameWithoutCheck.toLowerCase());
      if (rulesSkill && character.scores) {
        const abilityScore = (character.scores as Record<string, number>)[rulesSkill.ability] ?? 10;
        let modifier = getAbilityModifier(abilityScore);
        if (skill.proficient) modifier += character.proficiency ?? 2;
        return modifier;
      }

      return skill.modifier ?? 0;
    }
  }

  // Fallback: return 0 if skill not found
  console.warn(`Skill/Ability "${nameWithoutCheck}" not found for character`);
  return 0;
};
