import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameInstructionDto } from './GameInstructionDto.js';

/**
 * Chat message in history
 */
export class ChatMessageDto {
  @ApiProperty({ description: 'Message role', enum: [
    'user',
    'assistant',
    'system',
  ] })
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({ description: 'Narrative text (for assistant messages)' })
  narrative: string;

  @ApiPropertyOptional({ description: 'Game instructions (for assistant messages)', type: [GameInstructionDto] })
  instructions?: GameInstructionDto[];
}
