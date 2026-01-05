// Domain exports
export { Narrative } from './domain/entities/Narrative.js';
export { Message, type MessageRole } from './domain/value-objects/Message.js';
export { Context, type CharacterContextData } from './domain/value-objects/Context.js';
export {
  INarrativeRepository,
  NARRATIVE_REPOSITORY,
} from './domain/repositories/INarrativeRepository.js';

// Application service exports
export { NarrativeAppService } from './application/services/NarrativeAppService.js';
export { ConversationService } from './application/services/ConversationService.js';

// API layer exports
export { GameNarrativeModule } from './game-narrative.module.js';
export { NarrativeController } from './api/controllers/narrative.controller.js';
export {
  ConversationResponseDto,
  ChatMessageRequestDto,
  NarrativeResponseDto,
} from './api/dto/index.js';
