import { ApiProperty } from '@nestjs/swagger';

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
