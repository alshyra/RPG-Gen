import {
  describe, it, expect,
} from 'vitest';
import { getSkillBonus } from './skillService';

describe('getSkillBonus', () => {
  it('handles canonical skill name and applies proficiency', () => {
    const character: any = {
      scores: { Wis: 14 },
      proficiency: 2,
      skills: [
        {
          name: 'Perception',
          proficient: true,
        },
      ],
    };

    const bonus = getSkillBonus(character, 'Perception');
    // Wis 14 => +2, proficiency 2 => total +4
    expect(bonus)
      .toBe(4);
  });

  it('falls back to looking up skill by name when ability cannot be resolved', () => {
    const character: any = {
      scores: { Wis: 12 },
      proficiency: 2,
      skills: [
        {
          name: 'Perception',
          proficient: false,
          modifier: 1,
        },
      ],
    };

    // Should return explicit skill modifier when present
    expect(getSkillBonus(character, 'Something (Perception)'))
      .toBe(1);
  });
});
