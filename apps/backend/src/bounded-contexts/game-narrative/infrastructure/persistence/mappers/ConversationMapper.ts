import { Conversation } from '../../../domain/conversation/entities/Conversation.js';
import { Message, MessageRole } from '../../../domain/conversation/value-objects/Message.js';
import { ConversationDocument } from '../mongo/schemas/ConversationDocument.js';

/**
 * Maps between Conversation domain entity and Mongoose document
 */
export class ConversationMapper {
  static toDomain(doc: ConversationDocument): Conversation {
    const messages = (doc.messages ?? []).map(msg => {
      // Import GameInstruction types as needed
      const instructions = (msg.instructions ?? []) as any[];
      return new Message({
        role: msg.role as MessageRole,
        narrative: msg.narrative,
        instructions,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
      });
    });

    return new Conversation({
      userId: doc.userId,
      characterId: doc.characterId,
      messages,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toDocument(entity: Conversation, model: any): any {
    return model.updateOne(
      { userId: entity.userId, characterId: entity.characterId },
      {
        userId: entity.userId,
        characterId: entity.characterId,
        messages: entity.messages.map(msg => ({
          role: msg.role,
          narrative: msg.narrative,
          instructions: msg.instructions,
          timestamp: msg.timestamp,
        })),
        updatedAt: entity.updatedAt,
      },
      { upsert: true },
    );
  }
}
