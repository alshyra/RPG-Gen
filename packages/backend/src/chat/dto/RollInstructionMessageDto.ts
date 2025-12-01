import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';

/**
 * Metadata for roll instructions, typically used for combat attack/damage rolls
 */
export class RollMetaDto {
  @ApiPropertyOptional({ description: 'Attack bonus to apply' })
  attackBonus?: number;

  @ApiPropertyOptional({ description: 'Target name' })
  target?: string;

  @ApiPropertyOptional({ description: 'Target armor class' })
  targetAc?: number;

  @ApiPropertyOptional({ description: 'Damage dice expression' })
  damageDice?: string;

  @ApiPropertyOptional({ description: 'Damage bonus to apply' })
  damageBonus?: number;

  @ApiPropertyOptional({ description: 'Action type (e.g., attack, damage)' })
  action?: string;
}

export class RollInstructionMessageDto {
  @ApiProperty({
    description: 'Instruction type',
    enum: ['roll'],
  })
  type: 'roll';

  @ApiProperty({ description: 'Dice expression (e.g., 1d20+5)' })
  dices: string;

  @ApiPropertyOptional({
    description: 'Modifier to apply to the roll',
    oneOf: [
      { type: 'string' },
      { type: 'number' },
    ],
  })
  modifier?: string | number;

  @ApiPropertyOptional({ description: 'Roll description' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Advantage type',
    enum: [
      'advantage',
      'disadvantage',
      'none',
    ],
  })
  advantage?: 'advantage' | 'disadvantage' | 'none';

  @ApiPropertyOptional({
    description: 'Optional metadata for combat rolls',
    type: () => RollMetaDto,
  })
  meta?: RollMetaDto;
}
