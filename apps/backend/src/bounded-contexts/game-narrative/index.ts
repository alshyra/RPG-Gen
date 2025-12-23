// Domain exports
export { Narrative } from './domain/narrative/entities/Narrative.js';
export { Message, type MessageRole } from './domain/narrative/value-objects/Message.js';
export { Context, type CharacterContextData } from './domain/narrative/value-objects/Context.js';
export {
  INarrativeRepository,
  NARRATIVE_REPOSITORY,
} from './domain/narrative/repositories/INarrativeRepository.js';

// Application service exports
export { NarrativeAppService } from './application/services/NarrativeAppService.js';
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
