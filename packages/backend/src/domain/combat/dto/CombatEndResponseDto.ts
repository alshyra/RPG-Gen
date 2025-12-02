import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import { CombatEndResultDto } from './CombatEndResultDto.js';
import {
  IsBoolean, IsString, IsOptional, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CombatEndResponseDto {
  @ApiProperty({ description: 'Whether the operation succeeded' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Human readable message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Optional instructions returned after ending combat',
    type: [CombatEndResultDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombatEndResultDto)
  instructions?: CombatEndResultDto[];
}
