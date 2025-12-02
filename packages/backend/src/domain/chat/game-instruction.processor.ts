import {
  Injectable, Logger,
} from '@nestjs/common';
import { CharacterService } from '../character/character.service.js';
import { CombatService } from '../combat/combat.service.js';
import type {
  CombatStartInstructionMessageDto,
  GameInstructionDto,
  HpInstructionMessageDto,
  InventoryInstructionMessageDto, RollInstructionMessageDto, SpellInstructionMessageDto, XpInstructionMessageDto,
} from './dto/index.js';
import type { CharacterResponseDto } from '../character/dto/CharacterResponseDto.js';
import { ChatOrchestrator } from '../../orchestrators/chat/index.js';

@Injectable()
export class GameInstructionProcessor {
  private readonly logger = new Logger(GameInstructionProcessor.name);

  constructor(
    private readonly characterService: CharacterService,
    private readonly combatService: CombatService,
  ) {}

  /**
   * Process an array of GameInstructionDto and apply side-effects (hp/xp/inventory/spells/combat).
   * Returns a summary including any pending roll instructions that require client action.
   */

  async processInstructions(userId: string, characterId: string, instructions: GameInstructionDto[]) {
    const pendingRolls: RollInstructionMessageDto[] = [];
    const characterDto = await this.characterService.findByCharacterId(userId, characterId);

    // Build a handler map that delegates to private methods to keep processInstructions concise
    const handlerMap: Record<string, (instr: GameInstructionDto) => Promise<void>> = {
      roll: (instr: GameInstructionDto) => this.handleRoll(userId, characterId, characterDto, pendingRolls, instr as RollInstructionMessageDto),
      hp: (instr: GameInstructionDto) => this.handleHp(userId, characterId, characterDto, instr as HpInstructionMessageDto),
      xp: (instr: GameInstructionDto) => this.handleXp(userId, characterId, characterDto, instr as XpInstructionMessageDto),
      inventory: (instr: GameInstructionDto) => this.handleInventory(userId, characterId, characterDto, instr as InventoryInstructionMessageDto),
      spell: (instr: GameInstructionDto) => this.handleSpell(userId, characterId, characterDto, instr as SpellInstructionMessageDto),
      combat_start: (instr: GameInstructionDto) => this.handleCombatStart(userId, characterId, characterDto, instr as CombatStartInstructionMessageDto),
      combat_end: () => this.handleCombatEnd(userId, characterId, characterDto),
    };

    await Promise.all(instructions.map(async (instruction) => {
      const handler = handlerMap[instruction.type];
      if (handler) {
        try {
          await handler(instruction);
        } catch (e) {
          this.logger.warn(`Failed to apply instruction for ${characterId}: ${(e as Error)?.message}`);
        }
      }
    }));

    return { pendingRolls };
  }

  private async handleRoll(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    pendingRolls: GameInstructionDto[],
    instr: RollInstructionMessageDto,
  ) {
    pendingRolls.push(instr);
  }

  private async handleHp(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    instr: HpInstructionMessageDto,
  ) {
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
  ) {
    const { xp } = instr;
    if (!characterDto || typeof xp !== 'number') return;
    const newXp = (characterDto?.totalXp || 0) + xp;
    await this.characterService.update(userId, characterId, { totalXp: newXp });
    this.logger.log(`Applied XP instruction: +${xp} to ${characterId} => ${newXp}`);
  }

  private async handleInventory(
    userId: string,
    characterId: string,
    characterDto: CharacterResponseDto,
    instr: InventoryInstructionMessageDto,
  ) {
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
  ) {
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
  ) {
    try {
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
  ) {
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
