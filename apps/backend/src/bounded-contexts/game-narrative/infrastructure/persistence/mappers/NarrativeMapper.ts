import { Narrative } from '../../../domain/narrative/entities/Narrative.js';
import { Message, MessageRole } from '../../../domain/narrative/value-objects/Message.js';
import { Context } from '../../../domain/narrative/value-objects/Context.js';
import { NarrativeDocument } from '../schemas/NarrativeDocument.js';

/**
 * Maps between Narrative domain entity and Mongoose document
 */
export class NarrativeMapper {
  static toDomain(doc: NarrativeDocument): Narrative {
    const messages = (doc.messages ?? []).map(msg => {
      return new Message({
        role: msg.role as MessageRole,
        narrative: msg.narrative,
        instructions: msg.instructions ?? [],
        timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
      });
    });

    const context = new Context({
      characterContext: doc.context.characterContext,
      systemPrompt: doc.context.systemPrompt,
      scenarioPrompt: doc.context.scenarioPrompt,
    });

    return new Narrative({
      userId: doc.userId,
      characterId: doc.characterId,
      sessionId: doc.sessionId,
      context,
      messages,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toPersistence(narrative: Narrative): Omit<NarrativeDocument, '_id'> {
    return {
      userId: narrative.userId,
      characterId: narrative.characterId,
      sessionId: narrative.sessionId,
      messages: narrative.messages.map(msg => this.messageToPersistence(msg)),
      context: {
        characterContext: narrative.context.characterContext,
        systemPrompt: narrative.context.systemPrompt,
        scenarioPrompt: narrative.context.scenarioPrompt,
      },
      createdAt: narrative.createdAt,
      updatedAt: narrative.updatedAt,
    };
  }

  static messageToPersistence(message: Message): any {
    return {
      role: message.role,
      narrative: message.narrative,
      instructions: message.instructions,
      timestamp: message.timestamp,
    };
  }
}
