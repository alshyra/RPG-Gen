import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationDocument, ConversationDocumentSchema, ConversationSchema } from './infrastructure/persistence/mongo/schemas/ConversationDocument.js';
import { NarrativeContextDocument, NarrativeContextDocumentSchema, NarrativeContextSchema } from './infrastructure/persistence/mongo/schemas/NarrativeContextDocument.js';
import { MongoConversationRepository } from './infrastructure/persistence/mongo/repositories/MongoConversationRepository.js';
import { MongoNarrativeContextRepository } from './infrastructure/persistence/mongo/repositories/MongoNarrativeContextRepository.js';
import { CONVERSATION_REPOSITORY, NARRATIVE_CONTEXT_REPOSITORY } from './domain/repositories/index.js';
import { ConversationAppService } from './application/services/ConversationAppService.js';
import { NarrativeContextAppService } from './application/services/NarrativeContextAppService.js';
import { GameNarrativeService } from './application/services/GameNarrativeService.js';
import { NarrativeController } from './api/controllers/narrative.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConversationDocumentSchema.name, schema: ConversationSchema },
      { name: NarrativeContextDocumentSchema.name, schema: NarrativeContextSchema },
    ]),
  ],
  controllers: [NarrativeController],
  providers: [
    // Repository bindings (port/adapter pattern)
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: MongoConversationRepository,
    },
    {
      provide: NARRATIVE_CONTEXT_REPOSITORY,
      useClass: MongoNarrativeContextRepository,
    },
    // Application services
    ConversationAppService,
    NarrativeContextAppService,
    GameNarrativeService,
  ],
  exports: [
    ConversationAppService,
    NarrativeContextAppService,
    GameNarrativeService,
    CONVERSATION_REPOSITORY,
    NARRATIVE_CONTEXT_REPOSITORY,
  ],
})
export class GameNarrativeModule {}
