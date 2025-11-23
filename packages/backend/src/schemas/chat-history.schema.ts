import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ChatHistoryDocument = ChatHistory & Document;

@Schema({ _id: false })
class MessageMeta {
  @Prop({ type: Object })
  usage: Record<string, any>;

  @Prop({ type: String })
  model: string;
}

@Schema({ _id: false })
class ChatMessage {
  @Prop({ required: true, type: String })
  role: string;

  @Prop({ required: true, type: String })
  text: string;

  @Prop({ required: true, type: Number })
  timestamp: number;

  @Prop({ type: MessageMeta })
  meta?: MessageMeta;
}

@Schema({ timestamps: true })
export class ChatHistory {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String })
  characterId: string; // Character UUID

  @Prop({ type: [ChatMessage], default: [] })
  messages: ChatMessage[];

  @Prop({ default: Date.now, type: Date })
  lastUpdated: Date;
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);

// Index for efficient querying
ChatHistorySchema.index({ userId: 1, characterId: 1 }, { unique: true });
