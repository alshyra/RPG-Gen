import type { CharacterDto as CharacterDto } from "@rpg/shared";

/**
 * Get the bonus for a specific skill check
 * Examples: "Perception Check", "Persuasion Check", "Stealth Check"
 * @param character The character to get the skill bonus from
 * @param skillNameWithCheck Skill name with "Check" suffix (e.g. "Perception Check")
 * @returns The skill bonus modifier
 */
export const getSkillBonus = (
  character: CharacterDto | null,
  skillNameWithCheck: string
): number => {
  if (!character) return 0;

  // Extract skill name from "Skill Name Check" format
  const skillName = skillNameWithCheck.replace(" Check", "").trim();

  // Try to find the skill in character's skills array
  if (character.skills && Array.isArray(character.skills)) {
    const skill = character.skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
    if (skill) return skill.modifier;
  }

  // Fallback: return 0 if skill not found
  console.warn(`Skill "${skillName}" not found for character`);
  return 0;
};

/**
 * Get all available skills for a character
 * @param character The character to get skills from
 */
export const getAvailableSkills = (
  character: CharacterDto | null
): Array<{ name: string; modifier: number }> => character?.skills || [];
