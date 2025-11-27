import { describe, it, expect } from 'vitest';
import { computeUpdatedSkills } from './skillsUtils';

describe('computeUpdatedSkills', () => {
  it('deselecting a proficient skill should only unmark that skill', () => {
    const existing = [
      { name: 'Athletics', proficient: true },
      { name: 'Perception', proficient: false },
    ];

    const result = computeUpdatedSkills('Athletics', existing);
    expect(result).toEqual([
      { name: 'Athletics', proficient: false },
      { name: 'Perception', proficient: false },
    ]);
  });

  it('selecting an existing but non-proficient skill should mark it proficient', () => {
    const existing = [{ name: 'Stealth', proficient: false }];
    const result = computeUpdatedSkills('Stealth', existing);
    expect(result).toEqual([{ name: 'Stealth', proficient: true }]);
  });

  it('selecting a skill that is not present should add it as proficient and leave others untouched', () => {
    const existing = [{ name: 'Athletics', proficient: false }];
    const result = computeUpdatedSkills('Acrobatics', existing);
    expect(result).toEqual([
      { name: 'Athletics', proficient: false },
      { name: 'Acrobatics', proficient: true, modifier: 0 },
    ]);
  });
});
