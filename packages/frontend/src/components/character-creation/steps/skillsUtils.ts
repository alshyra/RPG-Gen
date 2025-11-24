import type { SkillDto } from '@rpg-gen/shared';

/**
 * Update skills array when toggling a skill.
 * - If the skill is already marked proficient, mark only that skill as not proficient
 * - If the skill exists but not proficient, mark it as proficient
 * - Otherwise add it as proficient
 */
export function computeUpdatedSkills(skill: string, existingSkills: any[] = []): SkillDto[] {
  // If skill is currently proficient, just mark that one as not proficient
  const present = existingSkills.find((s: any) => s.name === skill);
  if (present && present.proficient) {
    return existingSkills.map((s: any) => (s.name === skill ? { ...s, proficient: false } : s));
  }

  // If skill exists but was not proficient, set it to proficient
  if (present) {
    return existingSkills.map((s: any) => (s.name === skill ? { ...s, proficient: true } : s));
  }

  // Not present: add a new entry marked proficient
  return [...existingSkills, { name: skill, proficient: true, modifier: 0 }];
}

export default computeUpdatedSkills;
