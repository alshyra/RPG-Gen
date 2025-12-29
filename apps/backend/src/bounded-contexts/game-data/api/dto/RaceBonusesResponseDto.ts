import { ApiPropertyOptional } from '@nestjs/swagger';

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
