import { DiceResultDto } from 'src/domain/dice/dto/DiceResultDto.js';

export interface MockDiceRollConfig {
  /** Fixed roll values to return sequentially */
  rolls?: number[];
  /** Fixed total to return (overrides rolls) */
  total?: number;
}

/**
 * Creates a mock DiceService that returns predictable values.
 * Usage:
 *   const mockDice = createMockDiceService({ rolls: [15, 6], total: 21 });
 *   // Override in test module:
 *   { provide: DiceService, useValue: mockDice }
 */
export function createMockDiceService(config: MockDiceRollConfig = {}) {
  const defaultRolls = config.rolls ?? [10];

  let callIndex = 0;

  return {
    /**
     * Mock rollDiceExpr - returns configured values
     */
    rollDiceExpr: (_expr: string, _rand?: () => number, _advantage?: string): DiceResultDto => {
      // Cycle through configured rolls if multiple calls
      const rollValue = defaultRolls[callIndex % defaultRolls.length];
      callIndex++;

      return {
        rolls: [rollValue],
        modifierValue: 0,
        total: config.total ?? rollValue,
      };
    },

    /**
     * Mock rollSingleDie - returns first configured roll
     */
    rollSingleDie: (_sides: number, _rand?: () => number): number => {
      const rollValue = defaultRolls[callIndex % defaultRolls.length];
      callIndex++;
      return rollValue;
    },

    /**
     * Mock rollMultipleDice - returns configured rolls
     */
    rollMultipleDice: (count: number, _sides: number, _rand?: () => number): number[] => {
      const result: number[] = Array.from({ length: count }, () => {
        const value = defaultRolls[callIndex % defaultRolls.length];
        callIndex++;
        return value;
      });
      return result;
    },

    /**
     * Reset call counter (useful between test cases)
     */
    reset: () => {
      callIndex = 0;
    },

    /**
     * Update configuration dynamically
     */
    setConfig: (newConfig: MockDiceRollConfig) => {
      if (newConfig.rolls) {
        defaultRolls.length = 0;
        defaultRolls.push(...newConfig.rolls);
      }
    },
  };
}

/**
 * Preset: Always hit (high roll for attack)
 */
export const mockDiceAlwaysHit = () => createMockDiceService({
  rolls: [20],
  total: 20,
});

/**
 * Preset: Always miss (low roll for attack)
 */
export const mockDiceAlwaysMiss = () => createMockDiceService({
  rolls: [1],
  total: 1,
});

/**
 * Preset: Fixed initiative values for predictable turn order
 */
export const mockDiceFixedInitiative = (initiatives: number[]) => createMockDiceService({ rolls: initiatives });
