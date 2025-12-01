import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RollInstructionMessageDto {
  @ApiProperty({ description: 'Instruction type', enum: ['roll'] })
  type: 'roll';

  @ApiProperty({ description: 'Dice expression (e.g., 1d20+5)' })
  dices: string;

  @ApiPropertyOptional({ description: 'Modifier' })
  modifier?: string | number;

  @ApiPropertyOptional({ description: 'Roll description' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Advantage type',
    enum: [
      'advantage',
      'disadvantage',
      'none',
    ],
  })
  advantage?: 'advantage' | 'disadvantage' | 'none';
}
