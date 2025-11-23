import type { CharacterDto } from '@rpg-gen/shared';

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

  // Check for format "Ability (Skill)" e.g. "Strength (Athletics)"
  const abilitySkillMatch = nameWithoutCheck.match(/^(\w+)\s*\((\w+)\)$/);

  if (abilitySkillMatch) {
    const abilityName = abilitySkillMatch[1].toLowerCase();
    const skillName = abilitySkillMatch[2];

    // Get the ability score
    const abilityKey = abilityMap[abilityName];
    if (!abilityKey || !character.scores) return 0;

    const abilityScore = (character.scores as Record<string, number>)[abilityKey] ?? 10;
    let modifier = getAbilityModifier(abilityScore);

    // Check if character is proficient in this skill
    if (character.skills && Array.isArray(character.skills)) {
      const skill = character.skills.find(s =>
        (s.name ?? '').toLowerCase() === skillName.toLowerCase(),
      );
      if (skill && skill.proficient) {
        // Add proficiency bonus
        modifier += character.proficiency ?? 2;
      }
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
    if (skill) return skill.modifier ?? 0;
  }

  // Fallback: return 0 if skill not found
  console.warn(`Skill/Ability "${nameWithoutCheck}" not found for character`);
  return 0;
};
