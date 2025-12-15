import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { GridPositionDto } from './GridPositionDto.js';
import { MovementEventDto } from './MovementEventDto.js';

export class MovementResponseDto {
  @ApiProperty({ description: 'Whether movement was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Final position after movement',
    type: GridPositionDto,
  })
  @ValidateNested()
  @Type(() => GridPositionDto)
  finalPosition: GridPositionDto;

  @ApiProperty({
    description: 'Ordered list of events that occurred during movement',
    type: [MovementEventDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovementEventDto)
  events: MovementEventDto[];

  @ApiProperty({ description: 'Remaining movement speed after this action' })
  @IsNumber()
  remainingMovement: number;

  @ApiPropertyOptional({ description: 'Error message if movement failed' })
  @IsOptional()
  errorMessage?: string;
}
