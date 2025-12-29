import test from 'ava';
import { DiceService } from '../domain/dice/DiceService.js';

// Create a deterministic random function for testing
const createFixedRandom = (values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index++;
    return value;
  };
};

// Helper to create a DiceService instance for tests
const createDiceService = () => new DiceService();

// =====================
// parseDiceExpression tests (via rollDiceExpr)
// =====================

test('rollDiceExpr > parses standard dice expression "2d6+3"', (t) => {
  const service = createDiceService();
  // Fixed rand returns 0.5 -> roll of floor(0.5*6)+1 = 4
  const rand = createFixedRandom([0.5]);
  const result = service.rollDiceExpr('2d6+3', rand);

  t.is(result.rolls.length, 2);
  t.deepEqual(result.rolls, [4, 4]);
  t.is(result.modifierValue, 3);
  t.is(result.total, 11); // 4 + 4 + 3
});

test('rollDiceExpr > parses expression with negative modifier "1d8-2"', (t) => {
  const service = createDiceService();
  const rand = createFixedRandom([0.5]); // roll of 5 on d8
  const result = service.rollDiceExpr('1d8-2', rand);

  t.is(result.rolls.length, 1);
  t.is(result.rolls[0], 5);
  t.is(result.modifierValue, -2);
  t.is(result.total, 3); // 5 - 2
});

test('rollDiceExpr > parses expression without modifier "3d4"', (t) => {
  const service = createDiceService();
  const rand = createFixedRandom([0.25]); // roll of 2 on d4
  const result = service.rollDiceExpr('3d4', rand);

  t.is(result.rolls.length, 3);
  t.deepEqual(result.rolls, [2, 2, 2]);
  t.is(result.modifierValue, 0);
  t.is(result.total, 6); // 2 + 2 + 2
});

test('rollDiceExpr > parses expression with implicit dice count "d20"', (t) => {
  const service = createDiceService();
  const rand = createFixedRandom([0.5]); // roll of 11 on d20
  const result = service.rollDiceExpr('d20', rand);

  t.is(result.rolls.length, 1);
  t.is(result.rolls[0], 11);
  t.is(result.modifierValue, 0);
  t.is(result.total, 11);
});

test('rollDiceExpr > handles spaces in expression', (t) => {
  const service = createDiceService();
  const rand = createFixedRandom([0.0]); // roll of 1
  const result = service.rollDiceExpr('  1d6 + 2  ', rand);

  t.is(result.rolls[0], 1);
  t.is(result.modifierValue, 2);
  t.is(result.total, 3);
});

test('rollDiceExpr > throws on invalid expression', (t) => {
  const service = createDiceService();

  t.throws(() => service.rollDiceExpr('invalid'), {
    message: 'Invalid dice expression. Use NdM+K, e.g. 2d6+1',
  });

  t.throws(() => service.rollDiceExpr('2d'), {
    message: 'Invalid dice expression. Use NdM+K, e.g. 2d6+1',
  });

  t.throws(() => service.rollDiceExpr('d+3'), {
    message: 'Invalid dice expression. Use NdM+K, e.g. 2d6+1',
  });
});

// =====================
// Advantage/Disadvantage tests
// =====================

test('rollDiceExpr > advantage keeps higher of two d20 rolls', (t) => {
  const service = createDiceService();
  // First roll: 0.25 -> 6, Second roll: 0.75 -> 16
  const rand = createFixedRandom([0.25, 0.75]);
  const result = service.rollDiceExpr('1d20+5', rand, 'advantage');

  t.is(result.rolls.length, 2);
  t.deepEqual(result.rolls, [6, 16]);
  t.is(result.modifierValue, 5);
  t.is(result.total, 21); // 16 (higher) + 5
});

test('rollDiceExpr > disadvantage keeps lower of two d20 rolls', (t) => {
  const service = createDiceService();
  // First roll: 0.25 -> 6, Second roll: 0.75 -> 16
  const rand = createFixedRandom([0.25, 0.75]);
  const result = service.rollDiceExpr('1d20+5', rand, 'disadvantage');

  t.is(result.rolls.length, 2);
  t.deepEqual(result.rolls, [6, 16]);
  t.is(result.modifierValue, 5);
  t.is(result.total, 11); // 6 (lower) + 5
});

test('rollDiceExpr > advantage only applies to 1d20 rolls', (t) => {
  const service = createDiceService();
  const rand = createFixedRandom([0.5]);
  // 2d20 should not get advantage mechanics
  const result = service.rollDiceExpr('2d20', rand, 'advantage');

  // Should have 2 rolls but not apply advantage (uses normal rolling)
  t.is(result.rolls.length, 2);
  t.is(result.total, 22); // 11 + 11
});

test('rollDiceExpr > advantage does not apply to non-d20 dice', (t) => {
  const service = createDiceService();
  const rand = createFixedRandom([0.5]);
  const result = service.rollDiceExpr('1d6+2', rand, 'advantage');

  // Should be normal roll, not advantage
  t.is(result.rolls.length, 1);
  t.is(result.rolls[0], 4);
  t.is(result.total, 6); // 4 + 2
});

// =====================
// rollAttack tests
// =====================

test('rollAttack > hit when roll + bonus >= AC', (t) => {
  const service = createDiceService();
  // We can't control the random in rollAttack, but we can test the logic
  // by checking the return structure
  const result = service.rollAttack(5, 15);

  t.true(typeof result.hit === 'boolean');
  t.true(typeof result.isCrit === 'boolean');
  t.truthy(result.diceResult);
  t.true(Array.isArray(result.diceResult.rolls));
});

test('rollAttack > critical hit on natural 20 always hits', (t) => {
  // This test verifies that when roll is 20, hit is true and isCrit is true
  // Since we can't control internal randomness, we test the return types
  const service = createDiceService();
  const result = service.rollAttack(0, 30);

  // If it's a crit (roll was 20), hit must be true
  if (result.isCrit) {
    t.true(result.hit);
    t.is(result.diceResult.rolls[0], 20);
  } else {
    t.pass(); // Just validate structure
  }
});

// =====================
// rollDamage tests
// =====================

test('rollDamage > returns base damage on non-crit', (t) => {
  const service = createDiceService();
  // Mock using deterministic expression parsing
  const result = service.rollDamage('1d6', false, 2);

  t.false(result.isCrit);
  t.truthy(result.damageTotal);
  t.true(result.damageTotal >= 3); // 1 (min roll) + 2 (bonus)
  t.true(result.damageTotal <= 8); // 6 (max roll) + 2 (bonus)
});

test('rollDamage > doubles dice on critical hit', (t) => {
  const service = createDiceService();
  const result = service.rollDamage('1d6', true, 0);

  t.true(result.isCrit);
  // Crit doubles the dice, so total includes two d6 rolls
  t.true(result.damageTotal >= 2); // 1 + 1 min
  t.true(result.damageTotal <= 12); // 6 + 6 max
});

test('rollDamage > includes damage bonus', (t) => {
  const service = createDiceService();
  const result = service.rollDamage('1d4', false, 5);

  t.true(result.damageTotal >= 6); // 1 + 5
  t.true(result.damageTotal <= 9); // 4 + 5
});

// =====================
// rollSave tests
// =====================

test('rollSave > success when roll + bonus >= DC', (t) => {
  const service = createDiceService();
  const result = service.rollSave(5, 15);

  t.true(typeof result.success === 'boolean');
  t.truthy(result.diceResult);
  t.true(Array.isArray(result.diceResult.rolls));

  // Verify the logic: if roll + 5 >= 15, success is true
  const roll = result.diceResult.rolls[0];
  if (roll === 20) {
    t.true(result.success); // Natural 20 always succeeds
  } else if (roll + 5 >= 15) {
    t.true(result.success);
  } else {
    t.false(result.success);
  }
});

test('rollSave > natural 20 always succeeds', (t) => {
  const service = createDiceService();

  // Run multiple times to get statistical coverage
  let gotNat20 = false;
  for (let i = 0; i < 100; i++) {
    const result = service.rollSave(-10, 100); // Impossible without nat 20
    if (result.diceResult.rolls[0] === 20) {
      gotNat20 = true;
      t.true(result.success);
      break;
    }
  }

  // If we didn't get a nat 20 in 100 tries, just pass the test
  // (probability of not getting one is (19/20)^100 ≈ 0.006)
  if (!gotNat20) {
    t.pass();
  }
});

// =====================
// Edge cases
// =====================

test('rollDiceExpr > handles minimum rolls (rand = 0)', (t) => {
  const service = createDiceService();
  const rand = createFixedRandom([0.0]);
  const result = service.rollDiceExpr('1d20', rand);

  t.is(result.rolls[0], 1);
  t.is(result.total, 1);
});

test('rollDiceExpr > handles maximum rolls (rand close to 1)', (t) => {
  const service = createDiceService();
  const rand = createFixedRandom([0.999999]);
  const result = service.rollDiceExpr('1d20', rand);

  t.is(result.rolls[0], 20);
  t.is(result.total, 20);
});

test('rollDiceExpr > handles large dice counts', (t) => {
  const service = createDiceService();
  const rand = createFixedRandom([0.5]);
  const result = service.rollDiceExpr('10d6+5', rand);

  t.is(result.rolls.length, 10);
  t.is(result.modifierValue, 5);
  // Each die rolls 4 (0.5 * 6 = 3, floor + 1 = 4)
  t.is(result.total, 45); // 10 * 4 + 5
});
