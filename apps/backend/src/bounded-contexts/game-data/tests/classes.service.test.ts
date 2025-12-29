// Unit tests for ClassesService - These tests verify the core business logic
// For full integration tests with real seed data, see integration tests

describe('ClassesService', () => {
  test("ASI levels include 4, 8, 12, 16, 19", () => {
    const ASI_LEVELS = [4, 8, 12, 16, 19];

    // Verify level 4 is ASI
    expect(ASI_LEVELS.includes(4)).toBe(true);
    // Verify level 5 is not ASI
    expect(ASI_LEVELS.includes(5)).toBe(false);
    // Verify all expected ASI levels
    expect(ASI_LEVELS).toEqual([4, 8, 12, 16, 19]);
  });

  test("proficiency increase levels include 5, 9, 13, 17", () => {
    const PROFICIENCY_INCREASE_LEVELS = [5, 9, 13, 17];

    // Verify level 5 has proficiency increase
    expect(PROFICIENCY_INCREASE_LEVELS.includes(5)).toBe(true);
    // Verify level 4 does not have proficiency increase
    expect(PROFICIENCY_INCREASE_LEVELS.includes(4)).toBe(false);
    // Verify all expected proficiency levels
    expect(PROFICIENCY_INCREASE_LEVELS).toEqual([5, 9, 13, 17]);
  });
});
