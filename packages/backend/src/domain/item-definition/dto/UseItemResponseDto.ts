import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CombatStateDto } from '../../combat/dto/CombatStateDto.js';
import type { CharacterResponseDto } from '../../character/dto/CharacterResponseDto.js';

export class UseItemResponseDto {
  @ApiProperty({ description: 'Whether the item was successfully used' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Amount healed (if applicable)' })
  healAmount?: number;

  @ApiPropertyOptional({ description: 'Updated combat state (if in combat)' })
  combatState?: CombatStateDto;

  @ApiPropertyOptional({ description: 'Updated character (if not in combat)' })
  character?: CharacterResponseDto;

  @ApiProperty({ description: 'Human-readable result message' })
  message: string;
}
