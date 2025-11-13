import { Module } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from "./chat.controller";
import { GeminiTextService } from "../external/text/gemini-text.service";
import { ConversationService } from "./conversation.service";
import { ChatHistory, ChatHistorySchema } from '../schemas/chat-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChatHistory.name, schema: ChatHistorySchema }]),
  ],
  controllers: [ChatController],
  providers: [GeminiTextService, ConversationService],
})
export class ChatModule {}
