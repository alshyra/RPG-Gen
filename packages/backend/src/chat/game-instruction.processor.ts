import { Injectable, Logger } from '@nestjs/common';
import { CharacterService } from '../character/character.service.js';
import { CombatService } from '../combat/combat.service.js';
import { GameInstructionDto, RollInstructionDto } from './dto/index.js';
import { DiceController } from '../dice/dice.controller.js';

@Injectable()
export class GameInstructionProcessor {
  private readonly logger = new Logger(GameInstructionProcessor.name);
  private readonly dice = new DiceController();

  constructor(
    private readonly characterService: CharacterService,
    private readonly combatService: CombatService,
  ) {}

  /**
   * Process an array of GameInstructionDto and apply side-effects (hp/xp/inventory/spells/combat).
   * Returns a summary including any pending roll instructions that require client action.
   */
  async processInstructions(userId: string, characterId: string, instructions: GameInstructionDto[]) {
    const pendingRolls: GameInstructionDto[] = [];
    // Fetch current character
    const charDoc = await this.characterService.findByCharacterId(userId, characterId);
    const characterDto = charDoc ? this.characterService.toCharacterDto(charDoc) : undefined;

    for (const instr of instructions || []) {
      try {
        if (instr.roll) {
          // Defer roll execution to client or a dedicated roll endpoint.
          pendingRolls.push(instr);
          continue;
        }

        if (typeof instr.hp === 'number') {
          if (!charDoc) continue;
          const newHp = (charDoc.hp || 0) + instr.hp;
          if (newHp <= 0) {
            await this.characterService.markAsDeceased(userId, characterId);
            this.logger.log(`Applied HP instruction: character ${characterId} deceased`);
          } else {
            await this.characterService.update(userId, characterId, { hp: newHp });
            this.logger.log(`Applied HP instruction: ${instr.hp} to ${characterId} => ${newHp}`);
          }
          continue;
        }

        if (typeof instr.xp === 'number') {
          if (!charDoc) continue;
          const newXp = (charDoc.totalXp || 0) + instr.xp;
          await this.characterService.update(userId, characterId, { totalXp: newXp });
          this.logger.log(`Applied XP instruction: +${instr.xp} to ${characterId} => ${newXp}`);
          continue;
        }

        if (instr.inventory) {
          // Use CharacterService API for inventory changes when possible
          try {
            if (instr.inventory.action === 'add') {
              await this.characterService.addInventoryItem(userId, characterId, {
                name: instr.inventory.name,
                qty: instr.inventory.quantity,
                description: instr.inventory.description,
              } as any);
              this.logger.log(`Inventory add applied for ${characterId}: ${instr.inventory.name}`);
            } else if (instr.inventory.action === 'remove') {
              // remove by definitionId/name - fallback to removeInventoryItem which expects itemId/definitionId
              await this.characterService.removeInventoryItem(userId, characterId, instr.inventory.name as any, instr.inventory.quantity || 1);
              this.logger.log(`Inventory remove applied for ${characterId}: ${instr.inventory.name}`);
            } else if (instr.inventory.action === 'use') {
              await this.characterService.removeInventoryItem(userId, characterId, instr.inventory.name as any, 1);
              this.logger.log(`Inventory use applied for ${characterId}: ${instr.inventory.name}`);
            }
          } catch (e) {
            this.logger.warn(`Inventory instruction failed for ${characterId}: ${(e as Error)?.message}`);
          }
          continue;
        }

        if (instr.spell) {
          if (!charDoc) continue;
          const s = instr.spell as any;
          if (s.action === 'learn') {
            const existing = charDoc.spells || [];
            const newSpell = {
              name: s.name,
              level: s.level,
              description: s.description || '',
              meta: {},
            };
            const spells = [
              ...existing,
              newSpell,
            ];
            await this.characterService.update(userId, characterId, { spells } as any);
            this.logger.log(`Spell learned for ${characterId}: ${s.name}`);
          } else if (s.action === 'forget') {
            const spells = (charDoc.spells || []).filter(sp => sp.name !== s.name);
            await this.characterService.update(userId, characterId, { spells } as any);
            this.logger.log(`Spell forgotten for ${characterId}: ${s.name}`);
          } else if (s.action === 'cast') {
            // Casting may have side effects handled elsewhere; just log for now
            this.logger.log(`Spell cast by ${characterId}: ${s.name}`);
          }
          continue;
        }

        if (instr.combat_start && instr.combat_start.length > 0 && characterDto) {
          try {
            await this.combatService.initializeCombat(characterDto, { combat_start: instr.combat_start } as any, userId);
            this.logger.log(`Combat initialized for ${characterId} from instruction`);
          } catch (e) {
            this.logger.warn(`Failed to initialize combat for ${characterId}: ${(e as Error)?.message}`);
          }
          continue;
        }

        if (instr.combat_end) {
          try {
            const result = await this.combatService.endCombat(characterId);
            if (result && result.xpGained) {
              // Award XP
              const newXp = (charDoc?.totalXp || 0) + (result.xpGained || 0);
              await this.characterService.update(userId, characterId, { totalXp: newXp });
            }
            this.logger.log(`Combat end processed for ${characterId}`);
          } catch (e) {
            this.logger.warn(`Failed to end combat for ${characterId}: ${(e as Error)?.message}`);
          }
          continue;
        }
      } catch (e) {
        this.logger.warn(`Failed to apply instruction for ${characterId}: ${(e as Error)?.message}`);
      }
    }

    return { pendingRolls };
  }
}
