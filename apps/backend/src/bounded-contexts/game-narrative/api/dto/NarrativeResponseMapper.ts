import { Message } from '../../domain/narrative/value-objects/Message.js';
import { NarrativeResponseDto } from './NarrativeResponseDto.js';

/**
 * Mapper for converting narrative/message objects to DTOs
 */
export class NarrativeResponseMapper {
  static messageToDto(message: Message): NarrativeResponseDto {
    return new NarrativeResponseDto({
      role: message.role,
      narrative: message.narrative,
      instructions: [...message.instructions],
    });
  }

  static messagesToDtos(messages: Message[]): NarrativeResponseDto[] {
    return messages.map(msg => this.messageToDto(msg));
  }
}

export const ConversationResponseMapper = NarrativeResponseMapper;
