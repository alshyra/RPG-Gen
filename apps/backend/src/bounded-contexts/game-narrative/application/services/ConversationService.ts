import { Injectable, Logger } from '@nestjs/common';
import { NarrativeAppService } from './NarrativeAppService.js';
import { Message, type MessageRole } from '../../domain/narrative/value-objects/Message.js';
import { Context } from '../../domain/narrative/value-objects/Context.js';
import type { ChatMessageDto } from '../../api/dto/response/ChatMessageDto.js';

/** Minimal character info needed for building summaries */
interface CharacterSummaryInput {
  name?: string;
  race?: { name?: string };
  className?: string;
  level?: number;
  gender?: string;
  stats?: { vigor?: number; finesse?: number; mind?: number; survival?: number };
  hp?: number;
  hpMax?: number;
  inventory?: Array<{ name?: string; qty?: number } | string>;
}

/**
 * ConversationService adapts NarrativeAppService for chat workflows.
 * Provides simpler interface for chat history operations.
 * 
 * @application game-narrative
 */
@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(private readonly narrativeAppService: NarrativeAppService) {}

  /**
   * Append a message to conversation history.
   * Creates narrative if it doesn't exist.
   */
  async append(
    userId: string,
    characterId: string,
    message: ChatMessageDto,
  ): Promise<void> {
    try {
      // Map role - only 'user' and 'assistant' are valid for Message
      const role: MessageRole = message.role === 'user' ? 'user' : 'assistant';
      
      const domainMessage = new Message({
        role,
        narrative: message.narrative,
        instructions: message.instructions ?? [],
        timestamp: new Date(),
      });

      await this.narrativeAppService.addMessage(userId, characterId, domainMessage);
    } catch (error) {
      // If narrative doesn't exist, create it first
      if (error instanceof Error && error.message.includes('not found')) {
        this.logger.debug(`Creating new narrative for user ${userId}, character ${characterId}`);
        const context = new Context({
          characterContext: { name: '', race: '', className: '', level: 1 },
          systemPrompt: '',
          scenarioPrompt: '',
        });
        await this.narrativeAppService.getOrCreateNarrative(
          userId,
          characterId,
          `session-${Date.now()}`,
          context,
        );

        const role: MessageRole = message.role === 'user' ? 'user' : 'assistant';
        const domainMessage = new Message({
          role,
          narrative: message.narrative,
          instructions: message.instructions ?? [],
          timestamp: new Date(),
        });
        await this.narrativeAppService.addMessage(userId, characterId, domainMessage);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get conversation history as ChatMessageDto array.
   */
  async getHistoryMessages(
    userId: string,
    characterId: string,
    count?: number,
  ): Promise<ChatMessageDto[]> {
    try {
      const messages = await this.narrativeAppService.getRecentMessages(
        userId,
        characterId,
        count ?? 20,
      );

      return messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        narrative: msg.narrative,
        instructions: [...msg.instructions],
      }));
    } catch {
      // Return empty history if narrative doesn't exist
      return [];
    }
  }

  /**
   * Build character summary string for chat context.
   */
  buildCharacterSummary(character: CharacterSummaryInput): string {
    const stats = character.stats ?? { vigor: 0, finesse: 0, mind: 0, survival: 0 };
    const maxHp = character.hpMax ?? character.hp ?? 0;
    const hp = character.hp ?? maxHp;

    let summary = `
Character Information:
- Name: ${character.name || 'Unknown'}
- Race: ${character.race?.name || 'Unknown'}
- Class: ${character.className || 'Unknown'}
- Level: ${character.level || 1}
- Gender: ${character.gender || 'Unknown'}

Stats:
- Vigor: ${stats.vigor}
- Finesse: ${stats.finesse}
- Mind: ${stats.mind}
- Survival: ${stats.survival}

Health: ${hp}/${maxHp || 'Unknown'}`;

    if (character.inventory && character.inventory.length > 0) {
      summary += '\n\nInventory:';
      character.inventory.forEach(item => {
        const itemName = typeof item === 'string' ? item : item.name;
        const quantity = typeof item === 'string' ? 1 : (item.qty ?? 1);
        summary += `\n- ${itemName} (x${quantity})`;
      });
    }

    return summary;
  }

  /**
   * Clear conversation history for a character.
   */
  async clearHistory(userId: string, characterId: string): Promise<void> {
    try {
      await this.narrativeAppService.clearNarrative(userId, characterId);
    } catch {
      // Ignore if narrative doesn't exist
    }
  }
}
