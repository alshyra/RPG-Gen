import {
  BadRequestException, Body, Controller, Post,
} from '@nestjs/common';
import {
  ApiBody, ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DiceService } from '../domain/dice/dice.service.js';
import { type AdvantageType } from '../domain/dice/dto/dice.js';
import { DiceRequestDto } from '../domain/dice/dto/DiceRequestDto.js';
import { DiceResultDto } from '../domain/dice/dto/DiceResultDto.js';

@ApiTags('dice')
@Controller('dice')
export class DiceController {
  constructor(
    private readonly diceService: DiceService,
  ) {

  }

  @Post()
  @ApiOperation({ summary: 'Roll dice expression like 1d6+2, optionally with advantage/disadvantage for d20' })
  @ApiBody({ type: DiceRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Dice throw result',
    type: DiceResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid dice expression',
  })
  roll(
    @Body('expr') expression: string,
    @Body('advantage') advantage: AdvantageType = 'none',
  ): DiceResultDto {
    if (!expression || typeof expression !== 'string') {
      throw new BadRequestException('Missing or invalid dice expression');
    }
    return this.diceService.rollDiceExpr(expression, undefined, advantage);
  }
}
