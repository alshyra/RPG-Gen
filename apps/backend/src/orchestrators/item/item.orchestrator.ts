import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ItemDefinitionDto } from "../../domain/item-definition/item-definition.dto.js";
import { CharacterAppService } from "../../application/character/CharacterAppService.js";
import { CharacterDtoMapper } from "../../api/character/dto/mappers/CharacterDtoMapper.js";
import {
  CreateInventoryItemDto,
  type CharacterResponseDto,
} from "../../domain/character/dto/index.js";
import type { InventoryInstructionMessageDto } from "../../domain/chat/dto/index.js";
import { CombatAppService } from "../../domain/combat/combat.app.service.js";
import type { CombatStateDto } from "../../domain/combat/dto/CombatStateDto.js";
import { DiceService } from "../../domain/dice/dice.service.js";
import { ItemDefinitionService } from "../../domain/item-definition/item-definition.service.js";

interface ConsumableMetaWithHeal {
  type: "consumable";
  usable?: boolean;
  combatUsable?: boolean;
  restUsable?: boolean;
  healDice?: string;
}

function isConsumableWithHeal(meta: unknown): meta is ConsumableMetaWithHeal {
  if (!meta || typeof meta !== "object") return false;
  const obj = meta as Record<string, unknown>;
  return obj.type === "consumable";
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
    private readonly characterAppService: CharacterAppService,
    private readonly dtoMapper: CharacterDtoMapper,
    private readonly combatService: CombatAppService,
    private readonly diceService: DiceService,
    private readonly itemDefinitionService: ItemDefinitionService,
  ) {}

  public async handleInventoryInstruction(
    userId: string,
    characterId: string,
    instr: InventoryInstructionMessageDto,
  ) {
    if (!instr.itemId)
      throw new BadRequestException("itemId is required for inventory instructions");
    if (instr.action === "add") {
      const item = await this.itemDefinitionService.findByDefinitionId(instr.itemId);
      if (!item) throw new BadRequestException(`Item definition ${instr.itemId} not found`);
      const newInventoryItem = new CreateInventoryItemDto(item);
      return this.characterAppService.addInventoryItem(userId, characterId, newInventoryItem);
    }
    if (instr.action === "remove") {
      return this.characterAppService.removeInventoryItem(
        userId,
        characterId,
        instr.itemId,
        instr.quantity ?? 1,
      );
    } else if (instr.action === "use") {
      return this.useItem(userId, characterId, instr.itemId);
    }
  }

  /**
   * Validate context for using a consumable item
   */
  private validateContext(
    itemLike: ItemDefinitionDto,
    meta: ConsumableMetaWithHeal,
    inCombat: boolean,
  ): void {
    const itemName = itemLike?.name || "Item";
    if (inCombat && meta.combatUsable === false) {
      throw new BadRequestException(`${itemName} cannot be used in combat`);
    }
    if (!inCombat && meta.restUsable === false && meta.combatUsable === true) {
      throw new BadRequestException(`${itemName} can only be used in combat`);
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
    characterDto: CharacterResponseDto,
    healAmount: number,
    itemName: string,
  ): Promise<UseItemResult> {
    const currentHp = characterDto.hp ?? 0;
    const maxHp = characterDto.hpMax ?? currentHp;
    const newHp = Math.min(currentHp + healAmount, maxHp);
    await this.characterAppService.update(userId, characterId, { hp: newHp });
    const updatedEntity = await this.characterAppService.findByUserAndId(userId, characterId);
    const updatedDto = await this.dtoMapper.toEnrichedDto(updatedEntity) as CharacterResponseDto;
    this.logger.log(`Healed ${healAmount} HP for ${characterId} outside combat`);
    return {
      success: true,
      healAmount,
      character: updatedDto,
      message: `${itemName} used. Healed ${healAmount} HP.`,
    };
  }

  /**
   * Use an item from the character's inventory.
   */
  async useItem(userId: string, characterId: string, itemId: string): Promise<UseItemResult> {
    const characterEntity = await this.characterAppService.findByUserAndId(userId, characterId);
    const characterDto = await this.dtoMapper.toEnrichedDto(characterEntity) as CharacterResponseDto;

    const itemDefinition = await this.itemDefinitionService.findByDefinitionId(itemId);
    if (!itemDefinition) throw new BadRequestException(`Item definition ${itemId} not found`);

    const { meta } = itemDefinition;
    if (!isConsumableWithHeal(meta))
      throw new BadRequestException(`Item ${itemDefinition.name} is not a consumable`);

    const inCombat = await this.combatService.isInCombat(characterId);
    this.validateContext(itemDefinition, meta, inCombat);

    const healAmount = meta.healDice ? this.diceService.rollDiceExpr(meta.healDice).total : 0;
    await this.characterAppService.removeInventoryItem(userId, characterId, itemId, 1);
    this.logger.log(`Item ${itemDefinition.name} consumed by character ${characterId}`);

    if (healAmount > 0 && inCombat)
      return this.applyHealInCombat(characterId, healAmount, itemDefinition.name ?? "Item");
    if (healAmount > 0)
      return this.applyHealOutOfCombat(
        userId,
        characterId,
        characterDto,
        healAmount,
        itemDefinition.name ?? "Item",
      );

    const updatedEntity = await this.characterAppService.findByUserAndId(userId, characterId);
    const updatedDto = await this.dtoMapper.toEnrichedDto(updatedEntity) as CharacterResponseDto;
    return {
      success: true,
      character: updatedDto,
      message: `${itemDefinition.name} used.`,
    };
  }
}
