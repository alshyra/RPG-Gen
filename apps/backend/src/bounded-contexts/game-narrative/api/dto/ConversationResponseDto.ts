import { ApiProperty } from '@nestjs/swagger';
import { NarrativeResponseDto } from './NarrativeResponseDto.js';

/**
 * Response DTO for conversation/narrative history
 */
export class ConversationResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Character ID' })
  characterId: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Messages', type: [NarrativeResponseDto] })
  messages: NarrativeResponseDto[];

  constructor(partial: Partial<ConversationResponseDto>) {
    Object.assign(this, partial);
  }
}
