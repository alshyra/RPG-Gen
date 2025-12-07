import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class SpellResponseDto {
  @ApiProperty({ description: 'Canonical spell definition ID' })
  @IsString()
  definitionId: string;

  @ApiProperty({ description: 'Spell name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Spell level' })
  @IsNumber()
  level: number;

  @ApiPropertyOptional({ description: 'Spell description' })
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Spell metadata',
    additionalProperties: true,
  })
  meta: Record<string, unknown>;
}
