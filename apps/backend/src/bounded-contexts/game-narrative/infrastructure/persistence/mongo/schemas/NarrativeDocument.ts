import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GameInstructionDto } from '../../../../api/dto/index.js';
import { CharacterContextData } from '../../../../domain/narrative/index.js';


@Schema({ collection: 'narratives', timestamps: true })
export class NarrativeDocument extends Document {
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

export const NarrativeSchema = SchemaFactory.createForClass(NarrativeDocument);
export type NarrativeDocumentType = NarrativeDocument & Document;

NarrativeSchema.index({ userId: 1, characterId: 1 }, { unique: true });

