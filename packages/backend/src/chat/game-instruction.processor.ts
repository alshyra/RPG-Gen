import { Injectable, Logger } from '@nestjs/common';
import { CharacterService } from '../character/character.service.js';
import { CombatService } from '../combat/combat.service.js';
import type { GameInstructionDto } from './dto/index.js';

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
  // eslint-disable-next-line max-statements
  async processInstructions(userId: string, characterId: string, instructions: GameInstructionDto[]) {
    const pendingRolls: GameInstructionDto[] = [];
    const characterDto = await this.characterService.findByCharacterId(userId, characterId);

    // eslint-disable-next-line no-restricted-syntax
    for (const instr of instructions) {
      try {
        switch (instr.type) {
          case 'roll':
            pendingRolls.push(instr);
            break;
          case 'hp': {
            const hp = (instr).hp as number | undefined;
            if (!characterDto || typeof hp !== 'number') break;
            const newHp = (characterDto.hp || 0) + hp;
            if (newHp <= 0) {
              await this.characterService.markAsDeceased(userId, characterId);
              this.logger.log(`Applied HP instruction: character ${characterId} deceased`);
            } else {
              await this.characterService.update(userId, characterId, { hp: newHp });
              this.logger.log(`Applied HP instruction: ${hp} to ${characterId} => ${newHp}`);
            }
            break;
          }
          case 'xp': {
            const xp = (instr).xp as number | undefined;
            if (!characterDto || typeof xp !== 'number') break;
            const newXp = (characterDto?.totalXp || 0) + xp;
            await this.characterService.update(userId, characterId, { totalXp: newXp });
            this.logger.log(`Applied XP instruction: +${xp} to ${characterId} => ${newXp}`);
            break;
          }
          case 'inventory': {
            const inv = instr;
            try {
              if (inv.action === 'add') {
                this.logger.warn(`Inventory add skipped for ${characterId}: cannot map name to definitionId for ${inv.name}`);
              } else if (inv.action === 'remove') {
                await this.characterService.removeInventoryItem(userId, characterId, String(inv.name), inv.quantity || 1);
                this.logger.log(`Inventory remove applied for ${characterId}: ${inv.name}`);
              } else if (inv.action === 'use') {
                await this.characterService.removeInventoryItem(userId, characterId, String(inv.name), 1);
                this.logger.log(`Inventory use applied for ${characterId}: ${inv.name}`);
              }
            } catch (e) {
              this.logger.warn(`Inventory instruction failed for ${characterId}: ${(e as Error)?.message}`);
            }
            break;
          }
          case 'spell': {
            const s = instr;
            if (!characterDto) break;
            if (s.action === 'learn') {
              const existing = characterDto?.spells || [];
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
              await this.characterService.update(userId, characterId, { spells });
              this.logger.log(`Spell learned for ${characterId}: ${s.name}`);
            } else if (s.action === 'forget') {
              const spells = (characterDto?.spells || []).filter((sp: { name: string }) => sp.name !== s.name);
              await this.characterService.update(userId, characterId, { spells });
              this.logger.log(`Spell forgotten for ${characterId}: ${s.name}`);
            } else if (s.action === 'cast') {
              this.logger.log(`Spell cast by ${characterId}: ${s.name}`);
            }
            break;
          }
          case 'combat_start': {
            if (instr.combat_start && instr.combat_start.length > 0 && characterDto) {
              try {
                await this.combatService.initializeCombat(characterDto, { combat_start: instr.combat_start }, userId);
                this.logger.log(`Combat initialized for ${characterId} from instruction`);
              } catch (e) {
                this.logger.warn(`Failed to initialize combat for ${characterId}: ${(e as Error)?.message}`);
              }
            }
            break;
          }
          case 'combat_end': {
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
            break;
          }
          default:
            break;
        }
      } catch (e) {
        this.logger.warn(`Failed to apply instruction for ${characterId}: ${(e as Error)?.message}`);
      }
    }

    return { pendingRolls };
  }
}
