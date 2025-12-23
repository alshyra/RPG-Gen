import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base stats DTO for class definitions
 */
export class ClassStatsResponseDto {
  @ApiProperty({ description: 'Base HP', example: 10 })
  hpBase: number;

  @ApiProperty({ description: 'HP gained per level', example: 4 })
  hpGain: number;

  @ApiProperty({ description: 'Action Points', example: 6 })
  pa: number;

  @ApiProperty({ description: 'Movement Points', example: 3 })
  pm: number;
}

/**
 * Talent rank DTO
 */
export class TalentRankResponseDto {
  @ApiProperty({ description: 'Rank number (1-5)', example: 1 })
  rank: number;

  @ApiProperty({ description: 'Aptitude ID for this rank', example: 'frappe_simple' })
  aptitudeId: string;

  @ApiProperty({ description: 'Talent points cost', example: 1 })
  pointCost: number;
}

/**
 * Talent tree (voie) DTO
 */
export class TalentTreeResponseDto {
  @ApiProperty({ description: 'Tree name', example: 'Voie du Guerrier' })
  name: string;

  @ApiProperty({ description: 'Tree ranks', type: [TalentRankResponseDto] })
  ranks: TalentRankResponseDto[];
}

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
