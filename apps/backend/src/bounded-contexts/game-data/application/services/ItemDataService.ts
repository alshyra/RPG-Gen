import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { ItemDefinition, ItemSlot, ItemMeta } from '../../domain/item/entities/ItemDefinition.js';
import { IItemRepository, ITEM_REPOSITORY } from '../../domain/item/repositories/IItemRepository.js';

/**
 * Application service for ItemDefinition data
 * 
 * @application game-data
 */
@Injectable()
export class ItemDataService {
  private readonly logger = new Logger(ItemDataService.name);

  constructor(@Inject(ITEM_REPOSITORY) private readonly itemRepository: IItemRepository) {}

  /**
   * Find an item by definition ID
   */
  async findById(definitionId: string): Promise<ItemDefinition | null> {
    return this.itemRepository.findById(definitionId);
  }

  /**
   * Get an item by definition ID or throw if not found
   */
  async getById(definitionId: string): Promise<ItemDefinition> {
    const item = await this.itemRepository.findById(definitionId);
    if (!item) {
      throw new NotFoundException(`Item '${definitionId}' not found`);
    }
    return item;
  }

  /**
   * Find multiple items by definition IDs
   */
  async findByIds(definitionIds: string[]): Promise<ItemDefinition[]> {
    return this.itemRepository.findByIds(definitionIds);
  }

  /**
   * Find all items
   */
  async findAll(): Promise<ItemDefinition[]> {
    return this.itemRepository.findAll();
  }

  /**
   * Find items by type (weapon, armor, consumable, etc.)
   */
  async findByType(type: string): Promise<ItemDefinition[]> {
    return this.itemRepository.findByType(type);
  }

  /**
   * Find starter items
   */
  async findStarters(): Promise<ItemDefinition[]> {
    return this.itemRepository.findStarters();
  }

  /**
   * Seed an item definition
   */
  async seed(data: {
    definitionId: string;
    name: string;
    description?: string;
    slot?: ItemSlot;
    meta?: ItemMeta;
  }): Promise<void> {
    const item = ItemDefinition.fromSeedData(data);
    await this.itemRepository.upsert(item);
  }

  /**
   * Upsert an item definition (for backwards compatibility)
   */
  async upsert(data: {
    definitionId: string;
    name: string;
    description?: string;
    slot?: ItemSlot;
    meta?: ItemMeta;
  }): Promise<void> {
    const item = ItemDefinition.fromSeedData({
      ...data,
      slot: data.slot as ItemSlot,
    });
    await this.itemRepository.upsert(item);
  }

  /**
   * Seed multiple items from JSON data
   * Accepts various JSON formats from seed files
   */
  async seedFromJson(data: Array<{
    definitionId: string;
    name: string;
    description?: string;
    slot?: string;
    meta?: Record<string, unknown>;
    isStarter?: boolean;
  }>): Promise<void> {
    const items = data.map(item => {
      // Normalize meta to include starter flag if specified at top level
      const meta: ItemMeta = {
        ...(item.meta as ItemMeta),
        starter: item.isStarter ?? (item.meta as ItemMeta)?.starter,
      };

      return ItemDefinition.fromSeedData({
        definitionId: item.definitionId,
        name: item.name,
        description: item.description,
        slot: item.slot as ItemSlot,
        meta,
      });
    });
    
    await this.itemRepository.bulkUpsert(items);
    this.logger.log(`Seeded ${items.length} items`);
  }

  /**
   * Check if an item exists
   */
  async exists(definitionId: string): Promise<boolean> {
    return this.itemRepository.exists(definitionId);
  }
}
