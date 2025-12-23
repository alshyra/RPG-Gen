import { ApiProperty } from '@nestjs/swagger';
import { Message } from '../../domain/narrative/value-objects/Message.js';

/**
 * Response DTO for narrative chat operations
 */
export class NarrativeResponseDto {
  @ApiProperty({ description: 'Narrative narrative content' })
  narrative: string;

  @ApiProperty({ description: 'Game instructions' })
  instructions?: any[];

  constructor(partial: Partial<NarrativeResponseDto>) {
    Object.assign(this, partial);
  }
}

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

  @ApiProperty({ description: 'Messages' })
  messages: NarrativeResponseDto[];

  constructor(partial: Partial<ConversationResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Mapper for converting narrative/message objects to DTOs
 */
export class NarrativeResponseMapper {
  static messageToDto(message: Message): NarrativeResponseDto {
    return new NarrativeResponseDto({
      narrative: message.narrative,
      instructions: message.instructions,
    });
  }

  static messagesToDtos(messages: Message[]): NarrativeResponseDto[] {
    return messages.map(msg => this.messageToDto(msg));
  }
}

export const ConversationResponseMapper = NarrativeResponseMapper;
