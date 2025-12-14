import { ApiProperty } from '@nestjs/swagger';

export class XpInstructionMessageDto {
  @ApiProperty({
    description: 'Instruction type',
    enum: ['xp'],
  })
  type: 'xp';

  @ApiProperty({ description: 'Amount of XP gained' })
  xp: number;
}
