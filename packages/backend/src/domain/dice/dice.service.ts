import { Injectable } from '@nestjs/common';
import { AdvantageType } from './dto/dice.js';
import { DiceResultDto } from './dto/DiceResultDto.js';

@Injectable()
export class DiceService {
  private rollWithAdvantage(
    sides: number,
    mod: number,
    advantage: AdvantageType,
    rand: () => number,
  ): DiceResultDto {
    const roll1 = 1 + Math.floor(rand() * sides);
    const roll2 = 1 + Math.floor(rand() * sides);
    const keptRoll = advantage === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
    return {
      rolls: [roll1, roll2],
      modifierValue: mod,
      total: keptRoll + mod,
    };
  };

  private rollNormal(diceCount: number, sides: number, modifierValue: number, rand: () => number): DiceResultDto {
    const rolls = Array.from({ length: diceCount }, () => 1 + Math.floor(rand() * sides));
    const total = rolls.reduce((s, v) => s + v, 0) + modifierValue;
    return {
      rolls,
      modifierValue: modifierValue,
      total,
    };
  };

  private parseDiceExpression(expr: string) {
    const normalizedExpression = expr.replace(/\s+/g, '');
    const match = normalizedExpression.match(/^([0-9]*)d([0-9]+)([+-][0-9]+)?$/i);
    if (!match) throw new Error('Invalid dice expression. Use NdM+K, e.g. 2d6+1');

    const diceCount = match[1] === '' ? 1 : parseInt(match[1], 10);
    const diceSides = parseInt(match[2], 10);
    const modifierValue = match[3] ? parseInt(match[3], 10) : 0;

    if (diceCount < 1 || diceSides < 1) throw new Error('Invalid dice numbers');

    return {
      diceCount,
      diceSides,
      modifierValue,
    };
  };

  rollDiceExpr(
    expr: string,
    rand: () => number = Math.random,
    advantage: AdvantageType = 'none',
  ): DiceResultDto {
    const {
      diceCount, diceSides, modifierValue,
    } = this.parseDiceExpression(expr);

    // advantage rolls are only available for narrative and for d20 checks
    if (advantage !== 'none' && diceSides === 20 && diceCount === 1) {
      return this.rollWithAdvantage(diceSides, modifierValue, advantage, rand);
    }

    return this.rollNormal(diceCount, diceSides, modifierValue, rand);
  }
}
