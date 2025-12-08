import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class SpellInstructionMessageDto {
  @ApiProperty({
    description: 'Instruction type',
    enum: ['spell'],
  })
  @IsEnum(['spell'])
  type: 'spell';

  @ApiProperty({
    description: 'Spell action',
    enum: [
      'learn',
      'cast',
      'forget',
    ],
  })
  @IsEnum(['learn', 'cast', 'forget'])
  action: 'learn' | 'cast' | 'forget';

  @ApiProperty({ description: 'Spell name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Spell level' })
  @IsNumber()
  level?: number;

  @ApiPropertyOptional({ description: 'Spell school' })
  @IsString()
  school?: string;

  @ApiPropertyOptional({ description: 'Spell description' })
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Spell definition ID for deterministic persistence' })
  @IsString()
  definitionId: string;

  @ApiPropertyOptional({
    description: 'Spell metadata',
    additionalProperties: true,
  })
  meta?: Record<string, unknown>;
}
