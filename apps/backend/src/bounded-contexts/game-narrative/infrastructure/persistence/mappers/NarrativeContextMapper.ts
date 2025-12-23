import { NarrativeContext } from '../../../domain/narrative/entities/NarrativeContext.js';
import { NarrativeContextDocument } from '../mongo/schemas/NarrativeContextDocument.js';

/**
 * Maps between NarrativeContext domain entity and Mongoose document
 */
export class NarrativeContextMapper {
  static toDomain(doc: NarrativeContextDocument): NarrativeContext {
    return new NarrativeContext({
      sessionId: doc.sessionId,
      characterContext: doc.characterContext,
      systemPrompt: doc.systemPrompt,
      scenarioPrompt: doc.scenarioPrompt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toDocument(entity: NarrativeContext): any {
    return {
      sessionId: entity.sessionId,
      characterContext: entity.characterContext,
      systemPrompt: entity.systemPrompt,
      scenarioPrompt: entity.scenarioPrompt,
      updatedAt: entity.updatedAt,
    };
  }
}
