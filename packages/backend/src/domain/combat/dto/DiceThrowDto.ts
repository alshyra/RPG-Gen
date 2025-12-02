import { ApiProperty } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsEnum,
} from 'class-validator';

export class DiceThrowDto {
  @ApiProperty({
    description: 'Action being resolved',
    example: 'attack',
  })
  @IsEnum(['damage', 'spell', 'skill', 'save', 'other'])
  action: 'damage' | 'spell' | 'skill' | 'save' | 'other';

  @ApiProperty({
    description: 'Target name (if applicable)',
    required: false,
  })
  @IsString()
  target: string;

  @ApiProperty({
    description: 'Total of the roll (sum)',
    required: false,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Kept die (raw d20 result) when applicable',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  die?: number;
}
