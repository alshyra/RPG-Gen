import { describe, test, expect } from '@jest/globals';
import { DiceService } from '../domain/services/DiceService.js';

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

describe('DiceService', () => {
  describe('rollDiceExpr', () => {
    test('parses standard dice expression "2d6+3"', () => {
      const service = createDiceService();
      // Fixed rand returns 0.5 -> roll of floor(0.5*6)+1 = 4
      const rand = createFixedRandom([0.5]);
      const result = service.rollDiceExpr('2d6+3', rand);

      expect(result.rolls.length).toBe(2);
      expect(result.rolls).toEqual([4, 4]);
      expect(result.modifierValue).toBe(3);
      expect(result.total).toBe(11); // 4 + 4 + 3
    });

    test('parses expression with negative modifier "1d8-2"', () => {
      const service = createDiceService();
      const rand = createFixedRandom([0.5]); // roll of 5 on d8
      const result = service.rollDiceExpr('1d8-2', rand);

      expect(result.rolls.length).toBe(1);
      expect(result.rolls[0]).toBe(5);
      expect(result.modifierValue).toBe(-2);
      expect(result.total).toBe(3); // 5 - 2
    });

    test('parses expression without modifier "3d4"', () => {
      const service = createDiceService();
      const rand = createFixedRandom([0.25]); // roll of 2 on d4
      const result = service.rollDiceExpr('3d4', rand);

      expect(result.rolls.length).toBe(3);
      expect(result.rolls).toEqual([2, 2, 2]);
      expect(result.modifierValue).toBe(0);
      expect(result.total).toBe(6); // 2 + 2 + 2
    });

    test('parses expression with implicit dice count "d20"', () => {
      const service = createDiceService();
      const rand = createFixedRandom([0.5]); // roll of 11 on d20
      const result = service.rollDiceExpr('d20', rand);

      expect(result.rolls.length).toBe(1);
      expect(result.rolls[0]).toBe(11);
      expect(result.modifierValue).toBe(0);
      expect(result.total).toBe(11);
    });

    test('handles spaces in expression', () => {
      const service = createDiceService();
      const rand = createFixedRandom([0.0]); // roll of 1
      const result = service.rollDiceExpr('  1d6 + 2  ', rand);

      expect(result.rolls[0]).toBe(1);
      expect(result.modifierValue).toBe(2);
      expect(result.total).toBe(3);
    });

    test('throws on invalid expression', () => {
      const service = createDiceService();

      expect(() => service.rollDiceExpr('invalid')).toThrow(
        'Invalid dice expression. Use NdM+K, e.g. 2d6+1'
      );

      expect(() => service.rollDiceExpr('2d')).toThrow(
        'Invalid dice expression. Use NdM+K, e.g. 2d6+1'
      );

      expect(() => service.rollDiceExpr('d+3')).toThrow(
        'Invalid dice expression. Use NdM+K, e.g. 2d6+1'
      );
    });
  });

  // =====================
  // Advantage/Disadvantage tests
  // =====================

  describe('advantage/disadvantage', () => {
    test('advantage keeps higher of two d20 rolls', () => {
      const service = createDiceService();
      // First roll: 0.25 -> 6, Second roll: 0.75 -> 16
      const rand = createFixedRandom([0.25, 0.75]);
      const result = service.rollDiceExpr('1d20+5', rand, 'advantage');

      expect(result.rolls.length).toBe(2);
      expect(result.rolls).toEqual([6, 16]);
      expect(result.modifierValue).toBe(5);
      expect(result.total).toBe(21); // 16 (higher) + 5
    });

    test('disadvantage keeps lower of two d20 rolls', () => {
      const service = createDiceService();
      // First roll: 0.25 -> 6, Second roll: 0.75 -> 16
      const rand = createFixedRandom([0.25, 0.75]);
      const result = service.rollDiceExpr('1d20+5', rand, 'disadvantage');

      expect(result.rolls.length).toBe(2);
      expect(result.rolls).toEqual([6, 16]);
      expect(result.modifierValue).toBe(5);
      expect(result.total).toBe(11); // 6 (lower) + 5
    });

    test('advantage only applies to 1d20 rolls', () => {
      const service = createDiceService();
      const rand = createFixedRandom([0.5]);
      // 2d20 should not get advantage mechanics
      const result = service.rollDiceExpr('2d20', rand, 'advantage');

      // Should have 2 rolls but not apply advantage (uses normal rolling)
      expect(result.rolls.length).toBe(2);
      expect(result.total).toBe(22); // 11 + 11
    });

    test('advantage does not apply to non-d20 dice', () => {
      const service = createDiceService();
      const rand = createFixedRandom([0.5]);
      const result = service.rollDiceExpr('1d6+2', rand, 'advantage');

      // Should be normal roll, not advantage
      expect(result.rolls.length).toBe(1);
      expect(result.rolls[0]).toBe(4);
      expect(result.total).toBe(6); // 4 + 2
    });
  });

  // =====================
  // Edge cases
  // =====================

  describe('edge cases', () => {
    test('handles minimum rolls (rand = 0)', () => {
      const service = createDiceService();
      const rand = createFixedRandom([0.0]);
      const result = service.rollDiceExpr('1d20', rand);

      expect(result.rolls[0]).toBe(1);
      expect(result.total).toBe(1);
    });

    test('handles maximum rolls (rand close to 1)', () => {
      const service = createDiceService();
      const rand = createFixedRandom([0.999999]);
      const result = service.rollDiceExpr('1d20', rand);

      expect(result.rolls[0]).toBe(20);
      expect(result.total).toBe(20);
    });

    test('handles large dice counts', () => {
      const service = createDiceService();
      const rand = createFixedRandom([0.5]);
      const result = service.rollDiceExpr('10d6+5', rand);

      expect(result.rolls.length).toBe(10);
      expect(result.modifierValue).toBe(5);
      // Each die rolls 4 (0.5 * 6 = 3, floor + 1 = 4)
      expect(result.total).toBe(45); // 10 * 4 + 5
    });
  });
});
