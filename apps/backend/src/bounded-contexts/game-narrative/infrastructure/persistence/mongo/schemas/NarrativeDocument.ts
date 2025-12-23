import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { GameInstructionDto } from '../../../domain/instruction/GameInstructionDto.js';
import type { CharacterContextData } from '../../../domain/narrative/value-objects/Context.js';

export type NarrativeDocument = HydratedDocument<NarrativeDocumentSchema>;

@Schema({ collection: 'narratives', timestamps: true })
export class NarrativeDocumentSchema {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  characterId: string;

  @Prop({ required: true, index: true, unique: true })
  sessionId: string;

  @Prop({ type: [Object], default: [] })
  messages: Array<{
    role: 'user' | 'assistant';
    narrative: string;
    instructions?: GameInstructionDto[];
    timestamp?: Date;
  }>;

  @Prop({ required: true, type: Object })
  context: {
    characterContext: CharacterContextData;
    systemPrompt: string;
    scenarioPrompt: string;
  };

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const NarrativeSchema = SchemaFactory.createForClass(NarrativeDocumentSchema);
NarrativeSchema.index({ userId: 1, characterId: 1 }, { unique: true });
