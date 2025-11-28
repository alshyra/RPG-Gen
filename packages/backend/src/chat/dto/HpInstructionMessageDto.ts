import { ApiProperty } from '@nestjs/swagger';

export class HpInstructionMessageDto {
  @ApiProperty({ description: 'Instruction type', enum: ['hp'] })
  type: 'hp';

  @ApiProperty({ description: 'Amount of HP change' })
  hp: number;
}
