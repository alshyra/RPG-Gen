import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ChatHistoryDocument = ChatHistory & Document;

@Schema({ _id: false })
class MessageMeta {
  @Prop({ type: Object })
  usage: Record<string, any>;

  @Prop()
  model: string;
}

@Schema({ _id: false })
class ChatMessage {
  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ type: MessageMeta })
  meta?: MessageMeta;
}

@Schema({ timestamps: true })
export class ChatHistory {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  sessionId: string; // Character UUID

  @Prop({ type: [ChatMessage], default: [] })
  messages: ChatMessage[];

  @Prop({ default: Date.now })
  lastUpdated: Date;
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);

// Index for efficient querying
ChatHistorySchema.index({ userId: 1, sessionId: 1 }, { unique: true });
