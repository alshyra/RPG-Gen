import { ApiProperty } from '@nestjs/swagger';
import { CombatStartEntryDto } from '../../combat/dto/CombatStartRequestDto.js';

export class CombatStartInstructionMessageDto {
  @ApiProperty({
    description: 'Instruction type',
    enum: ['combat_start'],
  })
  type: 'combat_start';

  @ApiProperty({
    description: 'Combat start entries',
    type: [CombatStartEntryDto],
  })
  combat_start: CombatStartEntryDto[];
}
