import { Injectable } from '@nestjs/common';
import { AdvantageType } from './dto/dice.js';
import { DiceResultDto } from './dto/DiceResultDto.js';
import { CombatDiceResultDto } from './dto/CombatDiceResultDto.js';

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
  }

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

  rollAttack(attackBonus: number, targetAc: number): { hit: boolean;
    isCrit: boolean;
    diceResult: DiceResultDto; } {
    const diceResult = this.rollDiceExpr('1d20');
    const [die] = diceResult.rolls;
    const totalAttack = die + attackBonus;
    const isCrit = die === 20;
    const fumble = die === 1;
    const hit = isCrit || (totalAttack >= targetAc && !fumble);
    return {
      hit,
      isCrit,
      diceResult,
    };
  }

  private computeTotal(diceResult?: DiceResultDto): number {
    if (!diceResult) return 0;
    if (typeof diceResult.total === 'number') return diceResult.total;
    if (Array.isArray(diceResult.rolls) && diceResult.rolls.length) return diceResult.rolls.reduce((s, v) => s + v, 0);
    return 0;
  };

  rollDamage(expression: string, isCrit: boolean, damageBonus = 0): CombatDiceResultDto {
    const base = this.rollDiceExpr(expression);
    const extra = isCrit ? this.rollDiceExpr(expression) : undefined;

    const total = this.computeTotal(base) + this.computeTotal(extra) + (damageBonus ?? 0);

    const result: CombatDiceResultDto = {
      ...base,
      isCrit,
      damageTotal: total,
    };

    return result;
  }
}
