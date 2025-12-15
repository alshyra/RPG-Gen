import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum ActionCost {
  ACTION = 'action',
  BONUS_ACTION = 'bonus-action',
  REACTION = 'reaction',
  FREE = 'free',
}

export class CombatActionResponseDto {
  @ApiProperty({ description: 'Whether the action was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Cost of the action',
    enum: ActionCost,
  })
  @IsEnum(ActionCost)
  cost: ActionCost;

  @ApiPropertyOptional({ description: 'Whether attack/spell hit (if applicable)' })
  @IsOptional()
  @IsBoolean()
  hit?: boolean;

  @ApiPropertyOptional({ description: 'Damage dealt (if applicable)' })
  @IsOptional()
  @IsNumber()
  damage?: number;

  @ApiPropertyOptional({ description: 'Healing restored (if applicable)' })
  @IsOptional()
  @IsNumber()
  healing?: number;

  @ApiPropertyOptional({ description: 'Description of action result' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Error message if action failed' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ description: 'Remaining actions for current turn' })
  @IsNumber()
  actionsRemaining: number;

  @ApiProperty({ description: 'Remaining bonus actions for current turn' })
  @IsNumber()
  bonusActionsRemaining: number;

  @ApiPropertyOptional({ description: 'Active effects for current turn (dash, disengage, etc.)' })
  @IsOptional()
  activeEffects?: string[];
}
