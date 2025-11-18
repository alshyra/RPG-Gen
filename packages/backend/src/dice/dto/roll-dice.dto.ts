import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RollDiceDto {
  @ApiProperty({ description: 'Dice expression, e.g., 1d20+3' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  expr!: string;
}
