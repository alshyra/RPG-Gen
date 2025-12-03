import { ApiProperty } from '@nestjs/swagger';

export class DiceResultDto {
  @ApiProperty({
    description: 'Individual dice roll results',
    type: [Number],
  })
  rolls: number[];

  @ApiProperty({ description: 'Modifier applied to the total' })
  modifierValue: number;

  @ApiProperty({ description: 'Total result (sum of rolls + modifier)' })
  total: number;
}
