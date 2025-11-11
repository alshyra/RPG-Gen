import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { GeminiService } from '../shared/gemini.service';
import { ConversationService } from './conversation.service';

@Module({
  controllers: [ChatController],
  providers: [GeminiService, ConversationService],
})
export class ChatModule {}
