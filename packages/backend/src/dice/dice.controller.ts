import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { rollDiceExpr } from './dice.util';
import { RollDiceDto } from './dto/roll-dice.dto';

@ApiTags('dice')
@Controller('dice')
export class DiceController {
  @Post()
  @ApiOperation({ summary: 'Roll dice expression like 1d6+2' })
  @ApiBody({ type: RollDiceDto })
  roll(@Body() body: RollDiceDto) {
    try {
      const result = rollDiceExpr(body.expr);
      return { ok: true, result };
    } catch (err) {
      throw new BadRequestException((err as Error).message || String(err));
    }
  }
}
