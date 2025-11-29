import { ApiProperty } from '@nestjs/swagger';

export class DiceThrowDto {
  @ApiProperty({ description: 'Action being resolved', example: 'attack' })
  action!: string;

  @ApiProperty({ description: 'Target name (if applicable)', required: false })
  target?: string;

  @ApiProperty({ description: 'Total of the roll (sum)', required: false })
  total?: number;

  @ApiProperty({ description: 'Kept die (raw d20 result) when applicable', required: false })
  die?: number;
}
