import { ApiProperty } from '@nestjs/swagger';
import { AttackResultDto } from './AttackResultDto.js';
import { CombatEnemyDto } from './CombatEnemyDto.js';

export class TurnResultDto {
  @ApiProperty({ description: 'Turn number' })
  turnNumber: number;

  @ApiProperty({ description: 'Round number' })
  roundNumber: number;

  @ApiProperty({
    description: 'Attacks performed by player',
    type: [AttackResultDto],
  })
  playerAttacks: AttackResultDto[];

  @ApiProperty({
    description: 'Attacks performed by enemies',
    type: [AttackResultDto],
  })
  enemyAttacks: AttackResultDto[];

  @ApiProperty({ description: 'Whether combat ended after this turn' })
  combatEnded: boolean;

  @ApiProperty({ description: 'Whether the player emerged victorious' })
  victory: boolean;

  @ApiProperty({ description: 'Whether the player was defeated' })
  defeat: boolean;

  @ApiProperty({
    description: 'Remaining enemies after the turn',
    type: [CombatEnemyDto],
  })
  remainingEnemies: CombatEnemyDto[];

  @ApiProperty({ description: 'Player\'s current HP after the turn' })
  playerHp: number;

  @ApiProperty({ description: 'Player\'s max HP' })
  playerHpMax: number;

  @ApiProperty({ description: 'Narrative text summarizing the turn' })
  narrative: string;
}
