import { ApiProperty } from '@nestjs/swagger';
import { RollInstructionMessageDto } from '../chat/dto/GameInstructionDto.js';

export class PendingRollsResponseDto {
  @ApiProperty({
    type: [RollInstructionMessageDto],
  })
  pendingRolls: RollInstructionMessageDto[];
}
