import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { GameInstruction } from '../../instruction/GameInstruction.js';

export type ConversationDocument = HydratedDocument<ConversationSchema>;

@Schema({ collection: 'conversations', timestamps: true })
export class ConversationSchema {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  characterId: string;

  @Prop({ type: [Object], default: [] })
  messages: Array<{
    role: 'user' | 'assistant';
    narrative: string;
    instructions?: GameInstruction[];
    timestamp?: Date;
  }>;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(ConversationSchema);
ConversationSchema.index({ userId: 1, characterId: 1 }, { unique: true });
