import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { GridPositionDto } from './GridPositionDto.js';

export class MovementRequestDto {
  @ApiProperty({ description: 'ID of the combatant to move' })
  @IsString()
  combatantId: string;

  @ApiProperty({
    description: 'Path of grid positions to traverse',
    type: [GridPositionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GridPositionDto)
  path: GridPositionDto[];
}
