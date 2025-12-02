import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import { RollMetaDto } from './RolllMetaDto.js';

/**
 * Metadata for roll instructions, typically used for combat attack/damage rolls
 */
export class RollInstructionMessageDto {
  @ApiProperty({
    description: 'Instruction type',
    enum: ['roll'],
  })
  type: 'roll';

  @ApiProperty({ description: 'Dice expression (e.g., 1d20+5)' })
  dices: string;

  @ApiPropertyOptional({
    description: 'Semantic modifier label (e.g., "wisdom (Perception)")',
  })
  modifierLabel?: string;

  @ApiPropertyOptional({
    description: 'Numeric modifier to apply to the roll (e.g., +3)',
  })
  modifierValue?: number;

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
