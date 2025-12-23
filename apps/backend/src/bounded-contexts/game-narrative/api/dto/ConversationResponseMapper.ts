import { Conversation } from '../../domain/conversation/entities/Conversation.js';
import { ConversationResponseDto, MessageResponseDto } from './ChatResponseDto.js';

/**
 * Maps Conversation domain entity to API response DTO
 */
export class ConversationResponseMapper {
  static toDto(entity: Conversation): ConversationResponseDto {
    return {
      userId: entity.userId,
      characterId: entity.characterId,
      messageCount: entity.getMessageCount(),
      messages: entity.messages.map(msg => ({
        role: msg.role,
        narrative: msg.narrative,
        instructions: msg.instructions.map(instr => ({
          type: instr.type,
          data: instr,
        })),
        timestamp: msg.timestamp.toISOString(),
      })),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
