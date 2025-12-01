import { ApiProperty } from '@nestjs/swagger';
import { CombatEndDto } from '../../combat/dto/CombatEndResultDto.js';

export class CombatEndInstructionMessageDto {
  @ApiProperty({
    description: 'Instruction type',
    enum: ['combat_end'],
  })
  type: 'combat_end';

  @ApiProperty({
    description: 'Combat end result',
    type: CombatEndDto,
  })
  combat_end: CombatEndDto;
}
