import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageMetaDto } from './MessageMetaDto.js';
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
  role: string;

  @ApiProperty({ description: 'Message text content' })
  text: string;

  @ApiProperty({ description: 'Unix timestamp of the message' })
  timestamp: number;

  @ApiPropertyOptional({ description: 'Message metadata', type: MessageMetaDto })
  meta?: MessageMetaDto;

  @ApiPropertyOptional({ description: 'Narrative text (for assistant messages)' })
  narrative?: string;

  @ApiPropertyOptional({ description: 'Game instructions (for assistant messages)', type: [GameInstructionDto] })
  instructions?: GameInstructionDto[];
}
