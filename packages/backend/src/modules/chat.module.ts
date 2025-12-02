import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterModule } from './character.module.js';
import { CombatModule } from './combat.module.js';
import { GeminiTextService } from '../infra/external/gemini-text.service.js';
import { ChatOrchestrator } from '../orchestrators/chat/index.js';
import { ChatController } from '../controllers/chat.controller.js';
import { ConversationService } from '../domain/chat/conversation.service.js';
import {
  ChatHistory, ChatHistorySchema,
} from '../infra/mongo/ChatHistory.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ChatHistory.name,
        schema: ChatHistorySchema,
      },
    ]),
    CharacterModule,
    CombatModule,
  ],
  controllers: [ChatController],
  providers: [
    GeminiTextService,
    ConversationService,
    ChatOrchestrator,
  ],
  exports: [ChatOrchestrator],
})
export class ChatModule {}
