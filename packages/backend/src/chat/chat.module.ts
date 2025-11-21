import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller.js';
import { GeminiTextService } from '../external/text/gemini-text.service.js';
import { ConversationService } from './conversation.service.js';
import { ChatHistory, ChatHistorySchema } from '../schemas/chat-history.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChatHistory.name, schema: ChatHistorySchema }]),
  ],
  controllers: [ChatController],
  providers: [GeminiTextService, ConversationService],
})
export class ChatModule {}
