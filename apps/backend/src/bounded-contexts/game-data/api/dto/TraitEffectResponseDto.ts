import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
