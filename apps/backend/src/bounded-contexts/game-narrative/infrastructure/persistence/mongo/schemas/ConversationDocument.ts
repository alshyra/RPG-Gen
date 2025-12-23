import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { GameInstructionDto } from '../../../domain/instruction/GameInstructionDto.js';

export type ConversationDocument = HydratedDocument<ConversationDocumentSchema>;

@Schema({ collection: 'conversations', timestamps: true })
export class ConversationDocumentSchema {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  characterId: string;

  @Prop({ type: [Object], default: [] })
  messages: Array<{
    role: 'user' | 'assistant';
    narrative: string;
    instructions?: GameInstructionDto[];
    timestamp?: Date;
  }>;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(ConversationDocumentSchema);
ConversationSchema.index({ userId: 1, characterId: 1 }, { unique: true });
