import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterModule } from '../character/character.module.js';
import { GeminiTextService } from '../external/text/gemini-text.service.js';
import { ChatHistory, ChatHistorySchema } from '../schemas/chat-history.schema.js';
import { ChatController } from './chat.controller.js';
import { ConversationService } from './conversation.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChatHistory.name, schema: ChatHistorySchema }]),
    CharacterModule,
  ],
  controllers: [ChatController],
  providers: [GeminiTextService, ConversationService],
})
export class ChatModule {}
