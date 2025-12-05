import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { CharacterService } from '../../domain/character/character.service.js';
import type { CharacterResponseDto } from '../../domain/character/dto/index.js';
import { ConversationService } from '../../domain/chat/conversation.service.js';
import type {
  CombatStartInstructionMessageDto,
  GameInstructionDto,
  HpInstructionMessageDto,
  RollInstructionMessageDto,
  SpellInstructionMessageDto,
  XpInstructionMessageDto,
} from '../../domain/chat/dto/index.js';
import { CombatAppService } from '../../domain/combat/combat.app.service.js';
import { GeminiTextService } from '../../infra/external/gemini-text.service.js';

/**
 * ChatOrchestrator coordinates chat-related flows that involve multiple domain services.
 * Migrated from GameInstructionProcessor to follow the orchestrator pattern.
 *
 * Responsibilities:
 * - Process game instructions (hp, xp, inventory, spells, combat_start, combat_end)
 * - Coordinate between CharacterService and CombatService
 * - Return pending rolls that require client action
 */
@Injectable()
export class ChatOrchestrator {
  private readonly logger = new Logger(ChatOrchestrator.name);

  constructor(
    private readonly characterService: CharacterService,
    private readonly combatService: CombatAppService,
    private readonly conversationService: ConversationService,
    private readonly geminiTexteService: GeminiTextService,
  ) {}

  public async getGMResponse(
    userId: string,
    characterId: string,
    userText: string,
  ) {
    const parsed = await this.geminiTexteService.sendMessage(characterId, userText);
    const assistantMsg = {
      role: 'assistant' as const,
      narrative: parsed.narrative || '',
      instructions: parsed.instructions || [],
    };

    // Save assistant reply to history
    await this.conversationService.append(userId, characterId, assistantMsg);

    // Process game instructions (apply side-effects) if any
    if (Array.isArray(parsed.instructions) && parsed.instructions.length > 0) {
      await this.processInstructions(userId, characterId, parsed.instructions);
    }

    return assistantMsg;
  }

  /**
   * Process an array of GameInstructionDto and apply side-effects.
   * Returns pending roll instructions that require client action.
  */
  async processInstructions(
    userId: string,
    characterId: string,
    instructions: GameInstructionDto[],
  ): Promise<{ pendingRolls: RollInstructionMessageDto[] }> {
    const pendingRolls: RollInstructionMessageDto[] = [];
    const characterDto = await this.characterService.findByCharacterId(userId, characterId);
    const handlerMap: Record<string, (instr: GameInstructionDto) => Promise<void>> = {
      roll: instr => this.handleRoll(pendingRolls, instr as RollInstructionMessageDto),
      hp: instr => this.handleHp(userId, characterId, characterDto, instr as HpInstructionMessageDto),
      xp: instr => this.handleXp(userId, characterId, characterDto, instr as XpInstructionMessageDto),
      // inventory: instr => this.handleInventory(userId, characterId, instr as InventoryInstructionMessageDto),
      spell: instr => this.handleSpell(userId, characterId, characterDto, instr as SpellInstructionMessageDto),
      combat_start: instr => this.handleCombatStart(userId, characterId, characterDto, instr as CombatStartInstructionMessageDto),
    };

    await Promise.all(
      instructions
        .filter(instruction => handlerMap[instruction.type])
        .map(async instruction => handlerMap[instruction.type](instruction)),
    );

    return { pendingRolls };
  }

  private async handleRoll(
    pendingRolls: RollInstructionMessageDto[],
    instr: RollInstructionMessageDto,
  ): Promise<void> {
    pendingRolls.push(instr);
  }

  private async handleHp(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    instr: HpInstructionMessageDto,
  ): Promise<void> {
    const { hp } = instr;
    if (!characterDto || typeof hp !== 'number') return;

    const newHp = (characterDto.hp || 0) + hp;
    if (newHp <= 0) {
      await this.characterService.markAsDeceased(userId, characterId);
      this.logger.log(`Applied HP instruction: character ${characterId} deceased`);
    } else {
      await this.characterService.update(userId, characterId, { hp: newHp });
      this.logger.log(`Applied HP instruction: ${hp} to ${characterId} => ${newHp}`);
    }
  }

  private async handleXp(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    instr: XpInstructionMessageDto,
  ): Promise<void> {
    const { xp } = instr;
    if (!characterDto || typeof xp !== 'number') return;

    const newXp = (characterDto?.totalXp || 0) + xp;
    await this.characterService.update(userId, characterId, { totalXp: newXp });
    this.logger.log(`Applied XP instruction: +${xp} to ${characterId} => ${newXp}`);
  }

  private async handleSpell(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    instr: SpellInstructionMessageDto,
  ): Promise<void> {
    try {
      if (instr.action === 'learn') {
        const existing = characterDto?.spells || [];
        const newSpell = {
          name: instr.name,
          level: instr.level,
          description: instr.description || '',
          meta: {},
        };
        const spells = [...existing, newSpell];
        await this.characterService.update(userId, characterId, { spells });
        this.logger.log(`Spell learned for ${characterId}: ${instr.name}`);
      } else if (instr.action === 'forget') {
        const spells = (characterDto?.spells || []).filter((sp: { name: string }) => sp.name !== instr.name);
        await this.characterService.update(userId, characterId, { spells });
        this.logger.log(`Spell forgotten for ${characterId}: ${instr.name}`);
      } else if (instr.action === 'cast') {
        this.logger.log(`Spell cast by ${characterId}: ${instr.name}`);
      }
    } catch (e) {
      this.logger.warn(`Spell instruction failed for ${characterId}: ${(e as Error)?.message}`);
    }
  }

  private async handleCombatStart(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    instr: CombatStartInstructionMessageDto,
  ): Promise<void> {
    try {
      this.logger.log(`Handling combat start for ${characterId} from instruction`);
      const alreadyInCombat = await this.combatService.isInCombat(characterId);
      if (alreadyInCombat) {
        this.logger.log(`Combat already active for ${characterId}, skipping re-initialization`);
        return;
      }
      await this.combatService.initializeCombat(characterDto, { combat_start: instr.combat_start }, userId);
      this.logger.log(`Combat initialized for ${characterId} from instruction`);
    } catch (e) {
      this.logger.warn(`Failed to initialize combat for ${characterId}: ${(e as Error)?.message}`);
    }
  }
}
