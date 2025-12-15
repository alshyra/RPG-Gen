/**
 * ChatModule Public API
 *
 * Defines what services from ChatModule can be imported by other modules.
 *
 * PUBLIC SERVICES (exported in module):
 * - ChatOrchestrator: Complex conversation workflows
 * - ConversationService: Chat history and message management
 *
 * INTERNAL SERVICES (not exported, module-private):
 * - GeminiTextService, GameParserUtil
 * - These are implementation details and should not be imported directly
 */

export { ChatOrchestrator } from "../orchestrators/chat/index.js";
export { ConversationService } from "../domain/chat/conversation.service.js";
