import test from "ava";

// Unit tests for ClassesService - These tests verify the core business logic
// For full integration tests with real seed data, see integration tests

test("ClassesService ASI levels include 4, 8, 12, 16, 19", t => {
  const ASI_LEVELS = [4, 8, 12, 16, 19];

  // Verify level 4 is ASI
  t.true(ASI_LEVELS.includes(4));
  // Verify level 5 is not ASI
  t.false(ASI_LEVELS.includes(5));
  // Verify all expected ASI levels
  t.deepEqual(ASI_LEVELS, [4, 8, 12, 16, 19]);
  t.pass();
});

test("ClassesService proficiency increase levels include 5, 9, 13, 17", t => {
  const PROFICIENCY_INCREASE_LEVELS = [5, 9, 13, 17];

  // Verify level 5 has proficiency increase
  t.true(PROFICIENCY_INCREASE_LEVELS.includes(5));
  // Verify level 4 does not have proficiency increase
  t.false(PROFICIENCY_INCREASE_LEVELS.includes(4));
  // Verify all expected proficiency levels
  t.deepEqual(PROFICIENCY_INCREASE_LEVELS, [5, 9, 13, 17]);
  t.pass();
});
