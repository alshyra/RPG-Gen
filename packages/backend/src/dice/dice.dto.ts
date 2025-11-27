import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiceThrowDto {
  @ApiProperty({ description: 'Individual dice roll results', type: [Number] })
  rolls: number[];

  @ApiProperty({ description: 'Modifier applied to the total' })
  mod: number;

  @ApiProperty({ description: 'Total result (sum of rolls + modifier)' })
  total: number;

  @ApiPropertyOptional({ description: 'Advantage type used for this roll', enum: [
    'advantage',
    'disadvantage',
    'none',
  ] })
  advantage?: 'advantage' | 'disadvantage' | 'none';

  @ApiPropertyOptional({ description: 'The roll that was kept (when using advantage/disadvantage)' })
  keptRoll?: number;

  @ApiPropertyOptional({ description: 'The roll that was discarded (when using advantage/disadvantage)' })
  discardedRoll?: number;
}
