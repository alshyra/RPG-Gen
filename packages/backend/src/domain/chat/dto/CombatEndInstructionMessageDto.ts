import { ApiProperty } from '@nestjs/swagger';
import { CombatEndResultDto } from 'src/domain/combat/dto/CombatEndResultDto.js';

export class CombatEndInstructionMessageDto extends CombatEndResultDto {
  @ApiProperty({
    description: 'Instruction type',
    enum: ['combat_end'],
  })
  type: 'combat_end';
}
