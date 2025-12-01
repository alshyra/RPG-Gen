import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';

export class SpellResponseDto {
  @ApiProperty({ description: 'Spell name' })
  name: string;

  @ApiPropertyOptional({ description: 'Spell level' })
  level?: number;

  @ApiPropertyOptional({ description: 'Spell description' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Spell metadata',
    additionalProperties: true,
  })
  meta?: Record<string, unknown>;
}
