import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber } from 'class-validator';

/**
 * DTO for combat damage dice roll results
 */
export class CombatDiceResultDto {
  @ApiProperty({ description: 'Individual dice roll results', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  rolls: number[];

  @ApiProperty({ description: 'Modifier applied to the total' })
  @IsNumber()
  modifierValue: number;

  @ApiProperty({ description: 'Total result (sum of rolls + modifier)' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Total damage dealt' })
  @IsNumber()
  damageTotal: number;

  @ApiProperty({ description: 'Whether this was a critical hit' })
  @IsBoolean()
  isCrit: boolean;
}
