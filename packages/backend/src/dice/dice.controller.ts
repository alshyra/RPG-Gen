import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import Joi from 'joi';
import { rollDiceExpr } from './dice.util.js';
import type { DiceRequest } from '@rpg-gen/shared';

const schema = Joi.object({ expr: Joi.string().required() });

@ApiTags('dice')
@Controller('dice')
export class DiceController {
  @Post()
  @ApiOperation({ summary: 'Roll dice expression like 1d6+2' })
  @ApiBody({ schema: { type: 'object' } })
  roll(@Body() body: DiceRequest) {
    const { error, value } = schema.validate(body);
    if (error) throw new BadRequestException(error.message);
    try {
      const result = rollDiceExpr(value.expr);
      return { ok: true, result };
    } catch (err) {
      throw new BadRequestException((err as Error).message || String(err));
    }
  }
}
