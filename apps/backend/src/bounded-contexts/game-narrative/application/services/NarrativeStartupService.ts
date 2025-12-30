import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConversationService } from './ConversationService.js';
import { GeminiTextService } from '../../infrastructure/external/index.js';
import { CharacterAppService } from '../../../character/application/services/CharacterAppService.js';
import { CharacterDtoMapper } from '../../../character/api/dto/mappers/CharacterDtoMapper.js';
import { CombatAppService } from '../../../combat/application/services/CombatAppService.js';
import type { CharacterResponseDto } from '../../../character/api/dto/index.js';
import type { GameInstructionDto } from '../../api/dto/response/GameInstructionDto.js';

/**
 * NarrativeStartupService handles the initialization of new narrative sessions.
 * Encapsulates the logic for starting a story with Gemini and processing initial instructions.
 */
@Injectable()
export class NarrativeStartupService {
  private readonly logger = new Logger(NarrativeStartupService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly geminiTextService: GeminiTextService,
    private readonly characterAppService: CharacterAppService,
    private readonly characterDtoMapper: CharacterDtoMapper,
    @Inject(forwardRef(() => CombatAppService))
    private readonly combatAppService: CombatAppService,
  ) {}

  /**
   * Initialize a new narrative session for a character.
   * - Ensures narrative exists
   * - Initializes Gemini chat with character context
   * - Generates GM intro message
   * - Processes any game instructions (combat, etc.)
   * 
   * @returns The GM's intro response
   */
  async startNarrative(
    userId: string,
    characterId: string,
  ): Promise<{ narrative: string; instructions: GameInstructionDto[] }> {
    this.logger.log(`Starting narrative for character ${characterId}`);
    
    // Ensure narrative exists
    await this.conversationService.ensureNarrativeExists(userId, characterId);
    
    // Get character data for context
    const characterEntity = await this.characterAppService.findByUserAndId(userId, characterId);
    const characterDto = await this.characterDtoMapper.toEnrichedDto(characterEntity);
    const characterSummary = this.conversationService.buildCharacterSummary(characterDto);
    
    // Initialize Gemini chat session with system prompt + character context
    await this.initializeGeminiSession(userId, characterId, characterDto, characterSummary);
    
    // Generate GM intro message
    const gmResponse = await this.geminiTextService.sendMessage(characterId, characterSummary);
    
    // Save the GM's intro message
    await this.conversationService.append(userId, characterId, {
      role: 'assistant',
      narrative: gmResponse.narrative || '',
      instructions: gmResponse.instructions || [],
    });
    
    // Process game instructions (combat_start, hp, xp, etc.)
    if (gmResponse.instructions?.length) {
      await this.processInstructions(userId, characterId, characterDto, gmResponse.instructions);
    }
    
    this.logger.log(`Story started for character ${characterId}`);
    
    return {
      narrative: gmResponse.narrative || '',
      instructions: gmResponse.instructions || [],
    };
  }

  /**
   * Initialize Gemini chat session with character context and previous messages
   */
  private async initializeGeminiSession(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    characterSummary: string,
  ): Promise<void> {
    const previousMessages = await this.conversationService.getHistoryMessages(userId, characterId);
    const geminiMessages = previousMessages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        narrative: msg.narrative,
        instructions: msg.instructions,
      }));
    
    this.geminiTextService.initializeChatSession(
      characterId,
      this.geminiTextService.initPrompt(characterDto, characterSummary),
      geminiMessages,
    );
  }

  /**
   * Process game instructions from GM response (fetches character data automatically)
   */
  async processInstructionsForCharacter(
    userId: string,
    characterId: string,
    instructions: GameInstructionDto[],
  ): Promise<void> {
    const characterEntity = await this.characterAppService.findByUserAndId(userId, characterId);
    const characterDto = await this.characterDtoMapper.toEnrichedDto(characterEntity);
    await this.processInstructions(userId, characterId, characterDto, instructions);
  }

  /**
   * Process game instructions from GM response
   */
  async processInstructions(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    instructions: GameInstructionDto[],
  ): Promise<void> {
    for (const instruction of instructions) {
      try {
        if (instruction.type === 'combat_start' && 'combat_start' in instruction) {
          await this.handleCombatStart(userId, characterId, characterDto, instruction);
        }
        // Other instruction handlers (hp, xp) are handled by frontend
      } catch (e) {
        this.logger.warn(`Failed to process instruction ${instruction.type}: ${(e as Error)?.message}`);
      }
    }
  }

  /**
   * Handle combat_start instruction - initialize combat session
   */
  private async handleCombatStart(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    instruction: GameInstructionDto,
  ): Promise<void> {
    if (!('combat_start' in instruction)) return;
    
    this.logger.log(`Handling combat start for ${characterId}`);
    const alreadyInCombat = await this.combatAppService.isInCombat(characterId);
    if (alreadyInCombat) {
      this.logger.log(`Combat already active for ${characterId}, skipping`);
      return;
    }
    
    await this.combatAppService.initializeCombat(
      characterDto,
      { combat_start: instruction.combat_start },
      userId,
    );
    this.logger.log(`Combat initialized for ${characterId}`);
  }
}
