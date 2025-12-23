import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Racial bonuses DTO
 */
export class RaceBonusesResponseDto {
  @ApiPropertyOptional({ description: 'Vigor bonus', example: 1 })
  vigor?: number;

  @ApiPropertyOptional({ description: 'Finesse bonus', example: 1 })
  finesse?: number;

  @ApiPropertyOptional({ description: 'Mind bonus', example: 1 })
  mind?: number;

  @ApiPropertyOptional({ description: 'Survival bonus', example: 1 })
  survival?: number;
}

/**
 * Trait effect DTO
 */
export class TraitEffectResponseDto {
  @ApiProperty({ description: 'Effect type', example: 'pa_bonus' })
  type: string;

  @ApiProperty({ description: 'Effect value', example: 1 })
  value: number;

  @ApiPropertyOptional({ description: 'Condition for effect', example: 'first_turn' })
  condition?: string;
}

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
