import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import * as Joi from 'joi';
import { rollDiceExpr } from './dice.util';

const schema = Joi.object({ expr: Joi.string().required() });

@ApiTags('dice')
@Controller('dice')
export class DiceController {
  @Post()
  @ApiOperation({ summary: 'Roll dice expression like 1d6+2' })
  @ApiBody({ schema: { type: 'object' } })
  roll(@Body() body: any) {
    const { error, value } = schema.validate(body);
    if (error) throw new BadRequestException(error.message);
    try {
      const result = rollDiceExpr(value.expr);
      return { ok: true, result };
    } catch (err: any) {
      throw new BadRequestException(err.message || String(err));
    }
  }
}
