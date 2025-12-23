// Domain exports
export { Conversation } from './domain/conversation/entities/Conversation.js';
export { Message, type MessageRole } from './domain/conversation/value-objects/Message.js';
export { NarrativeContext, type CharacterContextData } from './domain/narrative/entities/NarrativeContext.js';
export {
  IConversationRepository,
  CONVERSATION_REPOSITORY,
} from './domain/conversation/repositories/IConversationRepository.js';
export {
  INarrativeContextRepository,
  NARRATIVE_CONTEXT_REPOSITORY,
} from './domain/narrative/repositories/INarrativeContextRepository.js';

// Application service exports
export { ConversationAppService } from './application/services/ConversationAppService.js';
export { NarrativeContextAppService } from './application/services/NarrativeContextAppService.js';
export { GameNarrativeService } from './application/services/GameNarrativeService.js';

// API layer exports
export { GameNarrativeModule } from './game-narrative.module.js';
export { NarrativeController } from './api/controllers/narrative.controller.js';
export {
  ChatResponseDto,
  ConversationResponseDto,
  ChatMessageRequestDto,
  MessageResponseDto,
  InstructionResponseDto,
} from './api/dto/index.js';
