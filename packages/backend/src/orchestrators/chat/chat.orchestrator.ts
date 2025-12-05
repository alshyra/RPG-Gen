import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { CharacterService } from '../../domain/character/character.service.js';
import { CombatAppService } from '../../domain/combat/combat.app.service.js';
import type { CharacterResponseDto } from '../../domain/character/dto/index.js';
import type {
  CombatStartInstructionMessageDto,
  GameInstructionDto,
  HpInstructionMessageDto,
  InventoryInstructionMessageDto,
  RollInstructionMessageDto,
  SpellInstructionMessageDto,
  XpInstructionMessageDto,
} from '../../domain/chat/dto/index.js';

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
  ) {}

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
      inventory: instr => this.handleInventory(userId, characterId, instr as InventoryInstructionMessageDto),
      spell: instr => this.handleSpell(userId, characterId, characterDto, instr as SpellInstructionMessageDto),
      combat_start: instr => this.handleCombatStart(userId, characterId, characterDto, instr as CombatStartInstructionMessageDto),
      combat_end: () => this.handleCombatEnd(userId, characterId, characterDto),
    };

    await Promise.all(
      instructions.map(async (instruction) => {
        const handler = handlerMap[instruction.type];
        if (handler) {
          try {
            await handler(instruction);
          } catch (e) {
            this.logger.warn(`Failed to apply instruction for ${characterId}: ${(e as Error)?.message}`);
          }
        }
      }),
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

  private async handleInventory(
    userId: string,
    characterId: string,
    instr: InventoryInstructionMessageDto,
  ): Promise<void> {
    try {
      if (instr.action === 'add') {
        this.logger.warn(`Inventory add skipped for ${characterId}: cannot map name to definitionId for ${instr.name}`);
      } else if (instr.action === 'remove') {
        await this.characterService.removeInventoryItem(userId, characterId, String(instr.name), instr.quantity || 1);
        this.logger.log(`Inventory remove applied for ${characterId}: ${instr.name}`);
      } else if (instr.action === 'use') {
        await this.characterService.removeInventoryItem(userId, characterId, String(instr.name), 1);
        this.logger.log(`Inventory use applied for ${characterId}: ${instr.name}`);
      }
    } catch (e) {
      this.logger.warn(`Inventory instruction failed for ${characterId}: ${(e as Error)?.message}`);
    }
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
      // Skip if combat is already in progress to avoid resetting HP/initiative/turn on page refresh
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

  private async handleCombatEnd(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
  ): Promise<void> {
    try {
      const result = await this.combatService.endCombat(characterId);
      if (result && result.xpGained) {
        const newXp = (characterDto?.totalXp || 0) + (result.xpGained || 0);
        await this.characterService.update(userId, characterId, { totalXp: newXp });
      }
      this.logger.log(`Combat end processed for ${characterId}`);
    } catch (e) {
      this.logger.warn(`Failed to end combat for ${characterId}: ${(e as Error)?.message}`);
    }
  }
}
