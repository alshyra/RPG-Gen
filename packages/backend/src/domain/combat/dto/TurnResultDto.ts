import { ApiProperty } from '@nestjs/swagger';
import { AttackResultDto } from './AttackResultDto.js';
import { CombatEnemyDto } from './CombatEnemyDto.js';
import {
  IsNumber, IsArray, IsBoolean, IsString, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TurnResultDto {
  @ApiProperty({ description: 'Turn number' })
  @IsNumber()
  turnNumber: number;

  @ApiProperty({ description: 'Round number' })
  @IsNumber()
  roundNumber: number;

  @ApiProperty({
    description: 'Attacks performed by player',
    type: [AttackResultDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttackResultDto)
  playerAttacks: AttackResultDto[];

  @ApiProperty({
    description: 'Attacks performed by enemies',
    type: [AttackResultDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttackResultDto)
  enemyAttacks: AttackResultDto[];

  @ApiProperty({ description: 'Whether combat ended after this turn' })
  @IsBoolean()
  combatEnded: boolean;

  @ApiProperty({ description: 'Whether the player emerged victorious' })
  @IsBoolean()
  victory: boolean;

  @ApiProperty({ description: 'Whether the player was defeated' })
  @IsBoolean()
  defeat: boolean;

  @ApiProperty({
    description: 'Remaining enemies after the turn',
    type: [CombatEnemyDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombatEnemyDto)
  remainingEnemies: CombatEnemyDto[];

  @ApiProperty({ description: 'Player\'s current HP after the turn' })
  @IsNumber()
  playerHp: number;

  @ApiProperty({ description: 'Player\'s max HP' })
  @IsNumber()
  playerHpMax: number;

  @ApiProperty({ description: 'Narrative text summarizing the turn' })
  @IsString()
  narrative: string;
}
