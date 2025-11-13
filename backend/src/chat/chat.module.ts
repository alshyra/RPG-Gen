import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { GeminiTextService } from "../external/text/gemini-text.service";
import { ConversationService } from "./conversation.service";

@Module({
  controllers: [ChatController],
  providers: [GeminiTextService, ConversationService],
})
export class ChatModule {}
