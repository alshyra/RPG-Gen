import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CharacterContextData } from '../../domain/narrative/entities/NarrativeContext.js';

export type NarrativeContextDocument = HydratedDocument<NarrativeContextSchema>;

@Schema({ collection: 'narrative_contexts', timestamps: true })
export class NarrativeContextSchema {
  @Prop({ required: true, index: true, unique: true })
  sessionId: string;

  @Prop({ required: true, type: Object })
  characterContext: CharacterContextData;

  @Prop({ required: true })
  systemPrompt: string;

  @Prop({ required: true })
  scenarioPrompt: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const NarrativeContextSchema = SchemaFactory.createForClass(NarrativeContextSchema);
