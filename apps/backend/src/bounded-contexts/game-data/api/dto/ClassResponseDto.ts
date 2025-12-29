import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassStatsResponseDto } from './ClassStatsResponseDto.js';
import { TalentRankResponseDto } from './TalentRankResponseDto.js';
import { TalentTreeResponseDto } from './TalentTreeResponseDto.js';

// Re-export for convenience
export { ClassStatsResponseDto, TalentRankResponseDto, TalentTreeResponseDto };

/**
 * Class definition response DTO
 */
export class ClassResponseDto {
  @ApiProperty({ description: 'Class name (unique identifier)', example: 'guerrier' })
  name: string;

  @ApiProperty({ description: 'Base stats', type: ClassStatsResponseDto })
  baseStats: ClassStatsResponseDto;

  @ApiPropertyOptional({ description: 'Proficiencies (stat types)', type: [String], example: ['vigueur', 'finesse'] })
  proficiencies?: string[];

  @ApiPropertyOptional({ description: 'Starting aptitude IDs', type: [String], example: ['frappe_simple', 'posture_defensive'] })
  startingAptitudes?: string[];

  @ApiProperty({ description: 'Talent trees', type: [TalentTreeResponseDto] })
  talentTrees: TalentTreeResponseDto[];
}
