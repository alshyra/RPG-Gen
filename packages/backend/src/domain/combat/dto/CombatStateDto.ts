import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import { CombatEnemyDto } from './CombatEnemyDto.js';
import { CombatPlayerDto } from './CombatPlayerDto.js';
import { CombatantDto } from './CombatantDto.js';

export type CombatPhase = 'PLAYER_TURN' | 'AWAITING_DAMAGE_ROLL' | 'ENEMY_TURN' | 'COMBAT_ENDED';

export class CombatStateDto {
  @ApiProperty({ description: 'Character ID' })
  characterId: string;

  @ApiProperty({ description: 'Whether currently in combat' })
  inCombat: boolean;

  @ApiProperty({
    description: 'Active enemies',
    type: [CombatEnemyDto],
  })
  enemies: CombatEnemyDto[];

  @ApiProperty({
    description: 'Player state',
    type: CombatPlayerDto,
  })
  player: CombatPlayerDto;

  @ApiProperty({
    description: 'Turn order for combat',
    type: [CombatantDto],
  })
  turnOrder: CombatantDto[];

  @ApiProperty({ description: 'Index of current turn in turnOrder' })
  currentTurnIndex: number;

  @ApiProperty({ description: 'Current round number' })
  roundNumber: number;

  @ApiPropertyOptional({ description: 'Narrative summary of current combat' })
  narrative?: string;

  @ApiPropertyOptional({
    description: 'Valid targets available to player',
    type: [String],
  })
  validTargets?: string[];

  @ApiPropertyOptional({
    description: 'Current combat phase',
    enum: [
      'PLAYER_TURN',
      'AWAITING_DAMAGE_ROLL',
      'ENEMY_TURN',
      'COMBAT_ENDED',
    ],
  })
  phase?: CombatPhase;

  @ApiPropertyOptional({ description: 'Action token for idempotent action submission' })
  actionToken?: string;

  @ApiPropertyOptional({ description: 'Expected DTO type for the next action (e.g., AttackRequestDto, DiceThrowDto)' })
  expectedDto?: string;
}
