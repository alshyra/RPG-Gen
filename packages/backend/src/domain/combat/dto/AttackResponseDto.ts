import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiceResultDto } from 'src/domain/dice/dto/DiceResultDto.js';
import { RollInstructionMessageDto } from '../../chat/dto/index.js';
import { CombatStateDto } from './CombatStateDto.js';

export class AttackResponseDto {
  @ApiPropertyOptional({
    description: 'If player manage to hit the target, roll instruction for damage roll is provided here.',
    type: RollInstructionMessageDto,
  })
  rollInstruction?: RollInstructionMessageDto;

  @ApiPropertyOptional({
    description: 'Result of the hit roll for frontend display purposes.',
    type: DiceResultDto,
  })
  diceResult?: DiceResultDto;

  @ApiProperty({
    description: 'Returns the state of the combat',
    type: CombatStateDto,
  })
  combatState: CombatStateDto;
}
