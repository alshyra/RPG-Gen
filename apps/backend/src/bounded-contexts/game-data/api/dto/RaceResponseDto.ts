import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RaceBonusesResponseDto } from './RaceBonusesResponseDto.js';
import { TraitEffectResponseDto } from './TraitEffectResponseDto.js';

// Re-export for convenience
export { RaceBonusesResponseDto, TraitEffectResponseDto };

/**
 * Race definition response DTO
 */
export class RaceResponseDto {
  @ApiProperty({ description: 'Race ID (unique identifier)', example: 'humain' })
  id: string;

  @ApiProperty({ description: 'Display name', example: 'Humain' })
  name: string;

  @ApiProperty({ description: 'Trait name', example: 'Polyvalent' })
  trait: string;

  @ApiProperty({ description: 'Trait effect details', type: TraitEffectResponseDto })
  traitEffect: TraitEffectResponseDto;

  @ApiProperty({ description: 'Stat bonuses', type: RaceBonusesResponseDto })
  bonuses: RaceBonusesResponseDto;

  @ApiPropertyOptional({ description: 'Description for AI', example: 'Polyvalent, gagne +1 PA au premier tour.' })
  descriptionForAi?: string;

  @ApiProperty({ description: 'UI color (hex)', example: '#3b82f6' })
  color: string;

  @ApiProperty({ description: 'Icon emoji', example: '👤' })
  icon: string;
}
