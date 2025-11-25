import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { DiceThrowDto } from './dice.dto.js';

class DiceRequest {
  expr: string;
  advantage?: 'advantage' | 'disadvantage' | 'none';
}

@ApiTags('dice')
@Controller('dice')
export class DiceController {
  // eslint-disable-next-line max-statements
  rollDiceExpr(expr: string, rand: () => number = Math.random, advantage: 'advantage' | 'disadvantage' | 'none' = 'none'): DiceThrowDto {
    expr = expr.replace(/\s+/g, '');
    const m = expr.match(/^([0-9]*)d([0-9]+)([+-][0-9]+)?$/i);
    if (!m) throw new Error('Invalid dice expression. Use NdM+K, e.g. 2d6+1');
    const n = m[1] === '' ? 1 : parseInt(m[1], 10);
    const sides = parseInt(m[2], 10);
    const mod = m[3] ? parseInt(m[3], 10) : 0;
    if (n < 1 || sides < 1) throw new Error('Invalid dice numbers');

    // For advantage/disadvantage with d20, roll 2d20 and keep best/worst
    if (advantage !== 'none' && n === 1 && sides === 20) {
      const roll1 = 1 + Math.floor(rand() * sides);
      const roll2 = 1 + Math.floor(rand() * sides);
      const keptRoll = advantage === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      const discardedRoll = advantage === 'advantage' ? Math.min(roll1, roll2) : Math.max(roll1, roll2);
      const total = keptRoll + mod;
      return {
        rolls: [
          roll1, roll2,
        ],
        mod,
        total,
        advantage,
        keptRoll,
        discardedRoll,
      };
    }

    // Normal roll
    const rolls = Array.from({ length: n }, () => 1 + Math.floor(rand() * sides));
    const total = rolls.reduce((s, v) => s + v, 0) + mod;
    return { rolls, mod, total, advantage: 'none' };
  };

  @Post()
  @ApiOperation({ summary: 'Roll dice expression like 1d6+2, optionally with advantage/disadvantage for d20' })
  @ApiBody({ type: DiceRequest })
  @ApiResponse({ status: 200, description: 'Dice throw result' })
  roll(@Body('expr') expression: string, @Body('advantage') advantage: 'advantage' | 'disadvantage' | 'none' = 'none'): DiceThrowDto {
    if (!expression || typeof expression !== 'string') {
      throw new BadRequestException('Missing or invalid dice expression');
    }
    return this.rollDiceExpr(expression, undefined, advantage);
  }
}
