import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SpellMetaDto } from './SpellMetaDto.js';

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
    type: SpellMetaDto,
  })
  @ValidateNested()
  @Type(() => SpellMetaDto)
  meta: SpellMetaDto;
}
