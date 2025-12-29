import { ApiProperty } from '@nestjs/swagger';
import { TalentRankResponseDto } from './TalentRankResponseDto.js';

/**
 * Talent tree (voie) DTO
 */
export class TalentTreeResponseDto {
  @ApiProperty({ description: 'Tree name', example: 'Voie du Guerrier' })
  name: string;

  @ApiProperty({ description: 'Tree ranks', type: [TalentRankResponseDto] })
  ranks: TalentRankResponseDto[];
}
