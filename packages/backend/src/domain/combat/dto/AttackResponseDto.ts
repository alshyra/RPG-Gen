import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiceResultDto } from '../../../domain/dice/dto/DiceResultDto.js';
import { CombatDiceResultDto } from '../../../domain/dice/dto/CombatDiceResultDto.js';
import { CombatStateDto } from './CombatStateDto.js';

export class AttackResponseDto {
  @ApiPropertyOptional({
    description: 'Result of the hit roll for frontend display purposes.',
    type: DiceResultDto,
  })
  diceResult?: DiceResultDto;

  @ApiPropertyOptional({
    description: 'Damage roll result (includes isCrit and damageTotal), present when an attack hits.',
    type: CombatDiceResultDto,
  })
  damageDiceResult?: CombatDiceResultDto;

  @ApiPropertyOptional({
    description: 'Total numeric damage applied to the target (includes damage bonus, doubled on crit if applicable).',
    type: Number,
  })
  damageTotal?: number;

  @ApiPropertyOptional({
    description: 'Whether the hit was a critical strike.',
    type: Boolean,
  })
  isCrit?: boolean;

  @ApiProperty({
    description: 'Returns the state of the combat',
    type: CombatStateDto,
  })
  combatState: CombatStateDto;
}
