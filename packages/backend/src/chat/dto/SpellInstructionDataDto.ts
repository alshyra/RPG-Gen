import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Spell instruction data
 */
export class SpellInstructionDataDto {
  @ApiProperty({ description: 'Spell action', enum: [
    'learn',
    'cast',
    'forget',
  ] })
  action: 'learn' | 'cast' | 'forget';

  @ApiProperty({ description: 'Spell name' })
  name: string;

  @ApiPropertyOptional({ description: 'Spell level' })
  level?: number;

  @ApiPropertyOptional({ description: 'Spell school' })
  school?: string;

  @ApiPropertyOptional({ description: 'Spell description' })
  description?: string;
}
