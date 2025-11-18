import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GeminiTextService } from '../external/text/gemini-text.service';
import { CharacterModule } from '../character/character.module';
import { Conversation, ConversationHistorySchema } from '../schemas/conversation.schema';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationHistorySchema }]),
    CharacterModule,
  ],
  controllers: [ConversationController],
  providers: [GeminiTextService, ConversationService],
})
export class ConversationModule {}
