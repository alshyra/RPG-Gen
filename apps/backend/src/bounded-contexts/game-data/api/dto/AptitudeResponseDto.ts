import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Aptitude targeting DTO
 */
export class AptitudeTargetingResponseDto {
  @ApiProperty({ description: 'Target type', example: 'enemy' })
  type: string;

  @ApiPropertyOptional({ description: 'Range in cells', example: 3 })
  range?: number;

  @ApiPropertyOptional({ description: 'Area of effect', example: 1 })
  aoe?: number;
}

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
