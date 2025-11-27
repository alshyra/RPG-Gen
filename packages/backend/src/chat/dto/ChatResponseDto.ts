import { ApiProperty } from '@nestjs/swagger';
import { GameInstructionDto } from './GameInstructionDto.js';

/**
 * Chat response
 */
export class ChatResponseDto {
  @ApiProperty({ description: 'Narrative text from the AI (cleaned)' })
  text: string;

  @ApiProperty({ description: 'Game instructions extracted from the response', type: [GameInstructionDto] })
  instructions: GameInstructionDto[];
}
