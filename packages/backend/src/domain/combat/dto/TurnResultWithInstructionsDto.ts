import { ApiPropertyOptional } from '@nestjs/swagger';
import { TurnResultDto } from './TurnResultDto.js';
import type { GameInstructionDto } from '../../chat/dto/GameInstructionDto.js';
import {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  SpellInstructionMessageDto,
  InventoryInstructionMessageDto,
  CombatStartInstructionMessageDto,
  CombatEndInstructionMessageDto,
} from '../../chat/dto/index.js';
import {
  IsOptional, IsArray, IsNumber, IsString,
} from 'class-validator';
import type { CombatPhase } from './CombatStateDto.js';

export class TurnResultWithInstructionsDto extends TurnResultDto {
  @ApiPropertyOptional({
    description: 'Optional set of frontend instructions to apply after the turn',
    type: 'array',
    items: {
      oneOf: [
        { $ref: '#/components/schemas/RollInstructionMessageDto' },
        { $ref: '#/components/schemas/HpInstructionMessageDto' },
        { $ref: '#/components/schemas/XpInstructionMessageDto' },
        { $ref: '#/components/schemas/SpellInstructionMessageDto' },
        { $ref: '#/components/schemas/InventoryInstructionMessageDto' },
        { $ref: '#/components/schemas/CombatStartInstructionMessageDto' },
        { $ref: '#/components/schemas/CombatEndInstructionMessageDto' },
      ],
    },
  })
  @IsOptional()
  @IsArray()
  instructions?: GameInstructionDto[];

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
}

// Re-export instruction DTOs for OpenAPI schema generation
export {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  SpellInstructionMessageDto,
  InventoryInstructionMessageDto,
  CombatStartInstructionMessageDto,
  CombatEndInstructionMessageDto,
};
