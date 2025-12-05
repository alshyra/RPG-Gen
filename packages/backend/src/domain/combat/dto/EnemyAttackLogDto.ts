import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiceResultDto } from '../../../domain/dice/dto/DiceResultDto.js';
import { CombatDiceResultDto } from '../../../domain/dice/dto/CombatDiceResultDto.js';

/**
 * Represents a single enemy attack action during enemy turn.
 * Used to replay attacks with animations on the frontend.
 */
export class EnemyAttackLogDto {
  @ApiProperty({
    description: 'ID of the attacking enemy',
    example: 'goblin-1',
  })
  attackerId: string;

  @ApiProperty({
    description: 'Name of the attacking enemy',
    example: 'Goblin',
  })
  attackerName: string;

  @ApiProperty({
    description: 'ID of the target (player characterId)',
    example: 'char-123',
  })
  targetId: string;

  @ApiProperty({
    description: 'Whether the attack hit the target',
    example: true,
  })
  hit: boolean;

  @ApiPropertyOptional({
    description: 'Attack roll result',
    type: DiceResultDto,
  })
  attackRoll?: DiceResultDto;

  @ApiPropertyOptional({
    description: 'Damage roll result (only present if hit)',
    type: CombatDiceResultDto,
  })
  damageRoll?: CombatDiceResultDto;

  @ApiPropertyOptional({
    description: 'Total damage dealt (0 if miss)',
    example: 5,
  })
  damageTotal?: number;

  @ApiPropertyOptional({
    description: 'Whether the attack was a critical hit',
    example: false,
  })
  isCrit?: boolean;
}
