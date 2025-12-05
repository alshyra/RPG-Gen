import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import { CombatantDto } from './CombatantDto.js';
import {
  IsString, IsBoolean, IsArray, IsNumber, IsOptional, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type CombatPhase = 'PLAYER_TURN' | 'AWAITING_DAMAGE_ROLL' | 'ENEMY_TURN' | 'COMBAT_ENDED';

export class CombatStateDto {
  @ApiProperty({ description: 'Character ID' })
  @IsString()
  characterId: string;

  @ApiProperty({ description: 'Whether currently in combat' })
  @IsBoolean()
  inCombat: boolean;

  @ApiProperty({
    description: 'Active enemies',
    type: [CombatantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombatantDto)
  enemies: CombatantDto[];

  @ApiProperty({
    description: 'Player state',
    type: CombatantDto,
  })
  @ValidateNested()
  @Type(() => CombatantDto)
  player: CombatantDto;

  @ApiProperty({
    description: 'Turn order for combat',
    type: [CombatantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombatantDto)
  turnOrder: CombatantDto[];

  @ApiProperty({ description: 'Index of current turn in turnOrder' })
  @IsNumber()
  currentTurnIndex: number;

  @ApiProperty({ description: 'Current round number' })
  @IsNumber()
  roundNumber: number;

  @ApiPropertyOptional({ description: 'Narrative summary of current combat' })
  @IsOptional()
  @IsString()
  narrative?: string;

  @ApiPropertyOptional({
    description: 'Current combat phase',
    enum: [
      'PLAYER_TURN',
      'AWAITING_DAMAGE_ROLL',
      'ENEMY_TURN',
      'COMBAT_ENDED',
    ],
  })
  @IsOptional()
  @IsString()
  phase?: CombatPhase;

  @ApiPropertyOptional({ description: 'Action token for idempotent action submission' })
  @IsOptional()
  @IsString()
  actionToken?: string;

  @ApiPropertyOptional({ description: 'Expected DTO type for the next action (e.g., AttackRequestDto, DiceThrowDto)' })
  @IsOptional()
  @IsString()
  expectedDto?: string;

  // D&D 5e Action Economy
  @ApiPropertyOptional({ description: 'Remaining standard actions for current activation' })
  @IsOptional()
  @IsNumber()
  actionRemaining?: number;

  @ApiPropertyOptional({ description: 'Maximum standard actions per activation' })
  @IsOptional()
  @IsNumber()
  actionMax?: number;

  @ApiPropertyOptional({ description: 'Remaining bonus actions for current activation' })
  @IsOptional()
  @IsNumber()
  bonusActionRemaining?: number;

  @ApiPropertyOptional({ description: 'Maximum bonus actions per activation' })
  @IsOptional()
  @IsNumber()
  bonusActionMax?: number;

  constructor(init?: Partial<CombatStateDto>) {
    Object.assign(this, init);
    if (!this.player || !this.enemies || !this.turnOrder) {
      throw new Error('CombatStateDto requires player, enemies, and turnOrder to be provided');
    }
    // defaults
    this.enemies = this.enemies ?? [];
    this.player = this.player ?? new CombatantDto({
      isPlayer: true,
      id: '',
      initiative: 0,
    });
    this.turnOrder = this.turnOrder ?? [];
    this.characterId = this.characterId ?? '';
    this.inCombat = this.inCombat ?? false;
    this.currentTurnIndex = this.currentTurnIndex ?? 0;
    this.roundNumber = this.roundNumber ?? 1;
    this.phase = this.phase ?? 'PLAYER_TURN';
    this.actionRemaining = this.actionRemaining ?? 1;
    this.actionMax = this.actionMax ?? 1;
    this.bonusActionRemaining = this.bonusActionRemaining ?? 1;
    this.bonusActionMax = this.bonusActionMax ?? 1;
  }
}
