import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RaceResponseDto {
  @ApiPropertyOptional({ description: 'Race ID' })
  id?: string;

  @ApiPropertyOptional({ description: 'Race name' })
  name?: string;

  @ApiProperty({ description: 'Ability score modifiers', additionalProperties: { type: 'number' } })
  mods: Record<string, number>;
}
