import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CombatStateDto } from './CombatStateDto.js';
import { EnemyAttackLogDto } from './EnemyAttackLogDto.js';

/**
 * Response DTO for endPlayerTurn.
 * Contains the attack log for each enemy's action and the resulting combat state.
 */
export class EndPlayerTurnResponseDto {
  @ApiProperty({
    description: 'The current round number after enemy turn',
    example: 2,
  })
  roundNumber: number;

  @ApiProperty({
    description: 'List of enemy attack logs in execution order',
    type: [EnemyAttackLogDto],
  })
  attackLogs: EnemyAttackLogDto[];

  @ApiProperty({
    description: 'Total damage dealt to the player this turn',
    example: 12,
  })
  totalDamageToPlayer: number;

  @ApiPropertyOptional({
    description: 'Whether the player was defeated this turn',
    example: false,
  })
  playerDefeated?: boolean;

  @ApiProperty({
    description: 'Updated combat state after all enemy actions',
    type: CombatStateDto,
  })
  combatState: CombatStateDto;
}
