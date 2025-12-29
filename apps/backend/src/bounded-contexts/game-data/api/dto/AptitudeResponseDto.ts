import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AptitudeTargetingResponseDto } from './AptitudeTargetingResponseDto.js';
import { AptitudeEffectResponseDto } from './AptitudeEffectResponseDto.js';

// Re-export for convenience
export { AptitudeTargetingResponseDto, AptitudeEffectResponseDto };

/**
 * Aptitude response DTO
 */
export class AptitudeResponseDto {
  @ApiProperty({ description: 'Aptitude ID (unique identifier)', example: 'frappe_simple' })
  id: string;

  @ApiProperty({ description: 'Display name', example: 'Frappe simple' })
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Une attaque basique' })
  description?: string;

  @ApiProperty({ description: 'Action points cost', example: 2 })
  paCost: number;

  @ApiPropertyOptional({ description: 'Cooldown in turns', example: 0 })
  cooldown?: number;

  @ApiProperty({ description: 'Targeting information', type: AptitudeTargetingResponseDto })
  targeting: AptitudeTargetingResponseDto;

  @ApiPropertyOptional({ description: 'Effects list', type: [AptitudeEffectResponseDto] })
  effects?: AptitudeEffectResponseDto[];

  @ApiPropertyOptional({ description: 'Icon emoji', example: '⚔️' })
  icon?: string;
}
