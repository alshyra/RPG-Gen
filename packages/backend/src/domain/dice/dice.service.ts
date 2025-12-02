import { Injectable } from '@nestjs/common';
import { DiceThrowDto } from './dice.dto.js';

type AdvantageType = 'advantage' | 'disadvantage' | 'none';

interface ParsedDice {
  n: number;
  sides: number;
  mod: number;
}

const parseDiceExpression = (expr: string): ParsedDice => {
  const normalized = expr.replace(/\s+/g, '');
  const m = normalized.match(/^([0-9]*)d([0-9]+)([+-][0-9]+)?$/i);
  if (!m) throw new Error('Invalid dice expression. Use NdM+K, e.g. 2d6+1');
  const n = m[1] === '' ? 1 : parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  const mod = m[3] ? parseInt(m[3], 10) : 0;
  if (n < 1 || sides < 1) throw new Error('Invalid dice numbers');
  return { n, sides, mod };
};

const rollWithAdvantage = (
  sides: number,
  mod: number,
  advantage: 'advantage' | 'disadvantage',
  rand: () => number,
): DiceThrowDto => {
  const roll1 = 1 + Math.floor(rand() * sides);
  const roll2 = 1 + Math.floor(rand() * sides);
  const keptRoll = advantage === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
  const discardedRoll = advantage === 'advantage' ? Math.min(roll1, roll2) : Math.max(roll1, roll2);
  return {
    rolls: [roll1, roll2],
    mod,
    total: keptRoll + mod,
    advantage,
    keptRoll,
    discardedRoll,
  };
};

const rollNormal = (n: number, sides: number, mod: number, rand: () => number): DiceThrowDto => {
  const rolls = Array.from({ length: n }, () => 1 + Math.floor(rand() * sides));
  const total = rolls.reduce((s, v) => s + v, 0) + mod;
  return {
    rolls,
    mod,
    total,
    advantage: 'none',
  };
};

/**
 * Injectable service for dice rolling operations.
 * Extracted from DiceController to allow dependency injection in orchestrators.
 */
@Injectable()
export class DiceService {
  /**
   * Roll dice using an expression like "1d20+5", "2d6", "1d8-2"
   */
  rollDiceExpr(
    expr: string,
    rand: () => number = Math.random,
    advantage: AdvantageType = 'none',
  ): DiceThrowDto {
    const { n, sides, mod } = parseDiceExpression(expr);

    if (advantage !== 'none' && sides === 20 && n === 1) {
      return rollWithAdvantage(sides, mod, advantage, rand);
    }

    return rollNormal(n, sides, mod, rand);
  }

  /**
   * Roll a single die with the given number of sides
   */
  rollSingleDie(sides: number, rand: () => number = Math.random): number {
    return 1 + Math.floor(rand() * sides);
  }

  /**
   * Roll multiple dice and return the sum
   */
  rollMultipleDice(count: number, sides: number, rand: () => number = Math.random): number[] {
    return Array.from({ length: count }, () => this.rollSingleDie(sides, rand));
  }
}
