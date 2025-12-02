import {
  Prop, Schema, SchemaFactory,
} from '@nestjs/mongoose';
import {
  Document, Schema as MongooseSchema,
} from 'mongoose';
import { ChatMessage } from './ChatMessage.js';

export type ChatHistoryDocument = ChatHistory & Document;

@Schema({ timestamps: true })
export class ChatHistory {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    type: String,
  })
  characterId: string; // Character UUID

  @Prop({
    type: [ChatMessage],
    default: [],
  })
  messages: ChatMessage[];

  @Prop({
    default: Date.now,
    type: Date,
  })
  lastUpdated: Date;
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);

// Index for efficient querying
ChatHistorySchema.index({
  userId: 1,
  characterId: 1,
}, { unique: true });
