import { ApiProperty } from '@nestjs/swagger';

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
