import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterModule } from '../character/character.module.js';
import { CombatModule } from '../combat/combat.module.js';
import { GeminiTextService } from '../external/text/gemini-text.service.js';
import {
  ChatHistory, ChatHistorySchema,
} from './schema/ChatHistory.js';
import { GameInstructionProcessor } from './game-instruction.processor.js';
import { ChatController } from './chat.controller.js';
import { RollsController } from '../rolls/rolls.controller.js';
import { ConversationService } from './conversation.service.js';

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
  controllers: [
    ChatController,
    RollsController,
  ],
  providers: [
    GeminiTextService,
    ConversationService,
    GameInstructionProcessor,
  ],
})
export class ChatModule {}
