import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CharacterService } from '../../domain/character/character.service.js';
import { CombatAppService } from '../../domain/combat/combat.app.service.js';
import { DiceService } from '../../domain/dice/dice.service.js';
import type { InventoryInstructionMessageDto } from '../../domain/chat/dto/index.js';
import type { CombatStateDto } from '../../domain/combat/dto/CombatStateDto.js';
import { CreateInventoryItemDto, type CharacterResponseDto, type InventoryItemDto } from '../../domain/character/dto/index.js';
import { ItemDefinitionService } from '../../domain/item-definition/item-definition.service.js';

interface ConsumableMetaWithHeal {
  type: 'consumable';
  usable?: boolean;
  combatUsable?: boolean;
  restUsable?: boolean;
  healDice?: string;
}

function isConsumableWithHeal(meta: unknown): meta is ConsumableMetaWithHeal {
  if (!meta || typeof meta !== 'object') return false;
  return (meta as Record<string, unknown>).type === 'consumable';
}

export interface UseItemResult {
  success: boolean;
  healAmount?: number;
  combatState?: CombatStateDto;
  character?: CharacterResponseDto;
  message: string;
}

/**
 * ItemOrchestrator centralizes all item usage logic.
 * - Validates item existence and context (combat vs rest)
 * - Applies effects (heal, buffs, etc.)
 * - Consumes the item from inventory
 * - Returns updated combat state or character
 */
@Injectable()
export class ItemOrchestrator {
  private readonly logger = new Logger(ItemOrchestrator.name);

  constructor(
    private readonly characterService: CharacterService,
    private readonly combatService: CombatAppService,
    private readonly diceService: DiceService,
    private readonly itemDefinitionService: ItemDefinitionService,
  ) {}

  public async handleInventoryInstruction(
    userId: string,
    characterId: string,
    instr: InventoryInstructionMessageDto,
  ) {
    if (!instr.itemId) throw new BadRequestException('itemId is required for inventory instructions');
    if (instr.action === 'add') {
      const item = await this.itemDefinitionService.findByDefinitionId(instr.itemId);
      if (!item) throw new BadRequestException(`Item definition ${instr.itemId} not found`);
      const newInventoryItem = new CreateInventoryItemDto(item);
      return this.characterService.addInventoryItem(userId, characterId, newInventoryItem);
    }
    if (instr.action === 'remove') {
      return this.characterService.removeInventoryItem(userId, characterId, instr.itemId, instr.quantity ?? 1);
    } else if (instr.action === 'use') {
      return this.useItem(userId, characterId, instr.itemId);
    }
  }

  /**
   * Validate context for using a consumable item
   */
  private validateContext(item: InventoryItemDto, meta: ConsumableMetaWithHeal, inCombat: boolean): void {
    if (inCombat && meta.combatUsable === false) {
      throw new BadRequestException(`${item.name} cannot be used in combat`);
    }
    if (!inCombat && meta.restUsable === false && meta.combatUsable === true) {
      throw new BadRequestException(`${item.name} can only be used in combat`);
    }
  }

  /**
   * Apply heal in combat and return result
   */
  private async applyHealInCombat(
    characterId: string,
    healAmount: number,
    itemName: string,
  ): Promise<UseItemResult> {
    const combatState = await this.combatService.applyPlayerHeal(characterId, healAmount);
    this.logger.log(`Healed ${healAmount} HP for ${characterId} in combat`);
    return {
      success: true,
      healAmount,
      combatState,
      message: `${itemName} used. Healed ${healAmount} HP.`,
    };
  }

  /**
   * Apply heal outside combat and return result
   */
  private async applyHealOutOfCombat(
    userId: string,
    characterId: string,
    character: CharacterResponseDto,
    healAmount: number,
    itemName: string,
  ): Promise<UseItemResult> {
    const currentHp = character.hp ?? 0;
    const maxHp = character.hpMax ?? currentHp;
    const newHp = Math.min(currentHp + healAmount, maxHp);
    await this.characterService.update(userId, characterId, { hp: newHp });
    const updatedCharacter = await this.characterService.findByCharacterId(userId, characterId);
    this.logger.log(`Healed ${healAmount} HP for ${characterId} outside combat`);
    return {
      success: true,
      healAmount,
      character: updatedCharacter,
      message: `${itemName} used. Healed ${healAmount} HP.`,
    };
  }

  /**
   * Use an item from the character's inventory.
   */
  async useItem(userId: string, characterId: string, itemId: string): Promise<UseItemResult> {
    const character = await this.characterService.findByCharacterId(userId, characterId);

    const itemDefinition = await this.itemDefinitionService.findByDefinitionId(itemId);
    if (!itemDefinition) throw new BadRequestException(`Item definition ${itemId} not found`);

    const { meta } = itemDefinition;
    if (!isConsumableWithHeal(meta)) throw new BadRequestException(`Item ${itemDefinition.name} is not a consumable`);

    const inCombat = await this.combatService.isInCombat(characterId);
    this.validateContext(itemDefinition, meta, inCombat);

    const healAmount = meta.healDice ? this.diceService.rollDiceExpr(meta.healDice).total : 0;
    await this.characterService.removeInventoryItem(userId, characterId, itemId, 1);
    this.logger.log(`Item ${itemDefinition.name} consumed by character ${characterId}`);

    if (healAmount > 0 && inCombat) return this.applyHealInCombat(characterId, healAmount, itemDefinition.name ?? 'Item');
    if (healAmount > 0) return this.applyHealOutOfCombat(userId, characterId, character, healAmount, itemDefinition.name ?? 'Item');

    const updatedCharacter = await this.characterService.findByCharacterId(userId, characterId);
    return {
      success: true,
      character: updatedCharacter,
      message: `${itemDefinition.name} used.`,
    };
  }
}
