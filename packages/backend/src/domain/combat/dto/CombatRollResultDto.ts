import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiceThrowDto } from '../../dice/dto/dice.js';

/**
 * Combat roll result posted by clients when resolving a roll (damage/attack)
 * Extends DiceThrowDto with optional action and target metadata for the combat flow.
 */
export class CombatRollResultDto extends DiceThrowDto {
  @ApiPropertyOptional({ description: 'Optional action identifier (e.g., attack, damage)' })
  action?: string;

  @ApiPropertyOptional({ description: 'Optional target identifier (e.g., target name or id)' })
  target?: string;
}
