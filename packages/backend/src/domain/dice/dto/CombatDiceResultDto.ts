import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean, IsNumber,
  Min,
} from 'class-validator';
import { DiceResultDto } from './DiceResultDto.js';

export class CombatDiceResultDto extends DiceResultDto {
  @ApiProperty({
    description: 'Total damage dealt by the roll',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  damageTotal: number;

  @ApiProperty({
    description: 'Whether this damage roll was a critical hit',
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  isCrit: boolean;
}
