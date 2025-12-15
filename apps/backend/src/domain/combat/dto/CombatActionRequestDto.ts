import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CombatActionType {
  ATTACK = 'attack',
  DASH = 'dash',
  DISENGAGE = 'disengage',
  CAST_SPELL = 'cast-spell',
  SECOND_WIND = 'second-wind',
  RAGE = 'rage',
  CUNNING_ACTION = 'cunning-action',
  // Add more as needed
}

export class CombatActionRequestDto {
  @ApiProperty({
    description: 'Type of action to perform',
    enum: CombatActionType,
  })
  @IsEnum(CombatActionType)
  actionType: CombatActionType;

  @ApiPropertyOptional({
    description: 'Target combatant ID (for attacks/spells targeting enemies)',
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Spell name (for cast-spell actions)' })
  @IsOptional()
  @IsString()
  spellName?: string;

  @ApiPropertyOptional({ description: 'Feature/ability ID (for class features)' })
  @IsOptional()
  @IsString()
  featureId?: string;
}
