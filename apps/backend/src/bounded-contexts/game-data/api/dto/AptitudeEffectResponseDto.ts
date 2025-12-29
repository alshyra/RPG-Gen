import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Aptitude effect DTO
 */
export class AptitudeEffectResponseDto {
  @ApiProperty({ description: 'Effect type', example: 'damage' })
  type: string;

  @ApiPropertyOptional({ description: 'Base value', example: 10 })
  value?: number;

  @ApiPropertyOptional({ description: 'Scaling formula', example: '1d6+finesse' })
  scaling?: string;

  @ApiPropertyOptional({ description: 'Effect duration in turns', example: 2 })
  duration?: number;
}
