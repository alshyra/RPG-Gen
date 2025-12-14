import { ApiPropertyOptional } from '@nestjs/swagger';

export class AbilityScoresResponseDto {
  @ApiPropertyOptional({ description: 'Strength score' })
  Str?: number;

  @ApiPropertyOptional({ description: 'Dexterity score' })
  Dex?: number;

  @ApiPropertyOptional({ description: 'Constitution score' })
  Con?: number;

  @ApiPropertyOptional({ description: 'Intelligence score' })
  Int?: number;

  @ApiPropertyOptional({ description: 'Wisdom score' })
  Wis?: number;

  @ApiPropertyOptional({ description: 'Charisma score' })
  Cha?: number;
}
